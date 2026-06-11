from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from .models import WiFiSession, SessionActivity, NetworkDevice, AccessToken
from .serializers import (WiFiSessionSerializer, SessionActivitySerializer, 
                         NetworkDeviceSerializer, CreateSessionSerializer, 
                         SessionUpdateSerializer, AccessTokenSerializer,
                         ConnectWithTokenSerializer)


def track_device(user, mac_address, request):
    if not mac_address:
        return None

    device, created = NetworkDevice.objects.get_or_create(
        mac_address=mac_address,
        defaults={
            'user': user,
            'status': 'online',
            'ip_address': request.META.get('REMOTE_ADDR')
        }
    )
    if not created:
        device.user = user
        device.status = 'online'
        device.ip_address = request.META.get('REMOTE_ADDR')
        device.save()
    return device


def create_wifi_session_for_payment(user, payment, mac_address, request):
    end_time = timezone.now() + timedelta(hours=payment.plan.duration_hours)

    session = WiFiSession.objects.create(
        user=user,
        plan=payment.plan,
        payment=payment,
        mac_address=mac_address,
        end_time=end_time,
        status='active'
    )

    user.is_active_session = True
    user.save()
    track_device(user, mac_address, request)

    SessionActivity.objects.create(
        session=session,
        activity_type='session_start',
        details={'payment_id': str(payment.id)}
    )

    return session


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_session(request):
    """Create a new WiFi session from a completed payment"""
    serializer = CreateSessionSerializer(data=request.data)
    if serializer.is_valid():
        payment = serializer.validated_data['payment_id']
        mac_address = serializer.validated_data.get('mac_address')
        
        # Check user doesn't have active session
        active_session = WiFiSession.objects.filter(
            user=request.user, 
            status='active',
            end_time__gt=timezone.now()
        ).first()
        
        if active_session:
            return Response(
                {'error': 'User already has an active session'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session = create_wifi_session_for_payment(request.user, payment, mac_address, request)
        access_token = AccessToken.create_for_payment(payment, session=session, mac_address=mac_address)
        
        return Response({
            'message': 'WiFi session created successfully',
            'session': WiFiSessionSerializer(session).data,
            'access_token': AccessTokenSerializer(access_token).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def connect_with_token(request):
    """Connect a customer using a stored WiFi access token."""
    serializer = ConnectWithTokenSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    access_token = serializer.validated_data['code']
    mac_address = serializer.validated_data.get('mac_address') or access_token.mac_address

    if access_token.mac_address and mac_address and access_token.mac_address != mac_address:
        return Response(
            {'error': 'This token is registered to another device'},
            status=status.HTTP_400_BAD_REQUEST
        )

    session = access_token.session
    if session and session.is_active:
        if mac_address and session.mac_address != mac_address:
            session.mac_address = mac_address
            session.save(update_fields=['mac_address', 'updated_at'])
        track_device(access_token.user, mac_address, request)
    else:
        session = create_wifi_session_for_payment(
            access_token.user,
            access_token.payment,
            mac_address,
            request
        )
        access_token.session = session

    access_token.status = 'redeemed'
    access_token.mac_address = mac_address
    access_token.save(update_fields=['session', 'status', 'mac_address', 'updated_at'])

    return Response({
        'message': 'Token accepted',
        'session': WiFiSessionSerializer(session).data,
        'access_token': AccessTokenSerializer(access_token).data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_session(request):
    """Get user's current active session"""
    session = WiFiSession.objects.filter(
        user=request.user,
        status='active',
        end_time__gt=timezone.now()
    ).first()
    
    if session:
        serializer = WiFiSessionSerializer(session)
        return Response(serializer.data)
    else:
        return Response(
            {'message': 'No active session found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def session_history(request):
    """Get user's session history"""
    sessions = WiFiSession.objects.filter(user=request.user).order_by('-created_at')
    serializer = WiFiSessionSerializer(sessions, many=True)
    return Response({
        'sessions': serializer.data,
        'count': sessions.count()
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_session(request, session_id):
    """Update session status or data usage"""
    try:
        session = WiFiSession.objects.get(id=session_id, user=request.user)
        serializer = SessionUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            status = serializer.validated_data['status']
            data_used = serializer.validated_data.get('data_used')
            
            # Update status
            if status != session.status:
                old_status = session.status
                session.status = status
                session.last_activity = timezone.now()
                
                # Log activity
                SessionActivity.objects.create(
                    session=session,
                    activity_type=f'status_{status}',
                    details={'old_status': old_status, 'new_status': status}
                )
            
            # Update data usage
            if data_used is not None:
                session.data_used += data_used
                SessionActivity.objects.create(
                    session=session,
                    activity_type='data_usage',
                    data_amount=data_used,
                    details={'total_data_used': session.data_used}
                )
            
            # If session is ending, update user status
            if status in ['expired', 'terminated']:
                request.user.is_active_session = False
                request.user.save()
                
                # Update device status
                if session.mac_address:
                    try:
                        device = NetworkDevice.objects.get(mac_address=session.mac_address)
                        device.status = 'offline'
                        device.save()
                    except NetworkDevice.DoesNotExist:
                        pass
            
            session.save()
            return Response({
                'message': 'Session updated successfully',
                'session': WiFiSessionSerializer(session).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except WiFiSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def terminate_session(request, session_id):
    """Terminate an active session"""
    try:
        session = WiFiSession.objects.get(id=session_id, user=request.user, status='active')
        
        session.status = 'terminated'
        session.end_time = timezone.now()
        session.save()
        
        # Update user status
        request.user.is_active_session = False
        request.user.save()
        
        # Update device status
        if session.mac_address:
            try:
                device = NetworkDevice.objects.get(mac_address=session.mac_address)
                device.status = 'offline'
                device.save()
            except NetworkDevice.DoesNotExist:
                pass
        
        # Log activity
        SessionActivity.objects.create(
            session=session,
            activity_type='session_terminate',
            details={'terminated_by': 'user'}
        )
        
        return Response({
            'message': 'Session terminated successfully',
            'session': WiFiSessionSerializer(session).data
        })
        
    except WiFiSession.DoesNotExist:
        return Response(
            {'error': 'Active session not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def session_activities(request, session_id):
    """Get activities for a specific session"""
    try:
        session = WiFiSession.objects.get(id=session_id, user=request.user)
        activities = session.activities.order_by('-timestamp')
        serializer = SessionActivitySerializer(activities, many=True)
        return Response({
            'activities': serializer.data,
            'count': activities.count()
        })
    except WiFiSession.DoesNotExist:
        return Response(
            {'error': 'Session not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_devices(request):
    """Get user's registered devices"""
    devices = NetworkDevice.objects.filter(user=request.user).order_by('-last_seen')
    serializer = NetworkDeviceSerializer(devices, many=True)
    return Response({
        'devices': serializer.data,
        'count': devices.count()
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def register_device(request):
    """Register a new device"""
    mac_address = request.data.get('mac_address')
    
    if not mac_address:
        return Response(
            {'error': 'MAC address is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    device, created = NetworkDevice.objects.get_or_create(
        mac_address=mac_address,
        defaults={
            'user': request.user,
            'status': 'offline',
            'ip_address': request.META.get('REMOTE_ADDR'),
            'device_info': request.data.get('device_info', {})
        }
    )
    
    if not created:
        device.user = request.user
        device.device_info = request.data.get('device_info', device.device_info)
        device.save()
    
    serializer = NetworkDeviceSerializer(device)
    return Response({
        'message': 'Device registered successfully',
        'device': serializer.data
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def active_sessions(request):
    """Get all active sessions (admin only)"""
    sessions = WiFiSession.objects.filter(
        status='active',
        end_time__gt=timezone.now()
    ).order_by('-created_at')
    
    serializer = WiFiSessionSerializer(sessions, many=True)
    return Response({
        'sessions': serializer.data,
        'count': sessions.count()
    })


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def cleanup_expired_sessions(request):
    """Clean up expired sessions (admin only)"""
    expired_sessions = WiFiSession.objects.filter(
        status='active',
        end_time__lt=timezone.now()
    )
    
    count = expired_sessions.count()
    expired_sessions.update(status='expired')
    
    # Update user statuses
    from django.contrib.auth import get_user_model
    User = get_user_model()
    User.objects.filter(is_active_session=True).update(is_active_session=False)
    
    return Response({
        'message': f'Cleaned up {count} expired sessions'
    })
