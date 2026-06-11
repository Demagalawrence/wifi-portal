from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.views.decorators.csrf import csrf_exempt
from .models import User, UserProfile
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def register(request):
    """Register a new user"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'message': 'User registered successfully',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'phone_number': user.phone_number
            },
            'token': token.key
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def login_view(request):
    """Login user and return token"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        
        # Update user profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.last_login_ip = request.META.get('REMOTE_ADDR')
        profile.save()
        
        return Response({
            'message': 'Login successful',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'phone_number': user.phone_number,
                'is_active_session': user.is_active_session
            },
            'token': token.key
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout user"""
    try:
        # Delete token
        request.user.auth_token.delete()
        logout(request)
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except:
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile(request):
    """Get user profile"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    """Update user profile"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    # Update allowed fields
    if 'mac_address' in request.data:
        profile.mac_address = request.data['mac_address']
    
    profile.save()
    
    serializer = UserProfileSerializer(profile)
    return Response({
        'message': 'Profile updated successfully',
        'profile': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_status(request):
    """Get current user status"""
    return Response({
        'user': {
            'id': str(request.user.id),
            'username': request.user.username,
            'phone_number': request.user.phone_number,
            'is_active_session': request.user.is_active_session,
            'is_authenticated': True
        }
    })
