from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
import requests
import uuid
import json
from .models import Payment, PaymentTransaction
from .serializers import PaymentInitiateSerializer, PaymentSerializer, PaymentTransactionSerializer


class PaymentProcessor:
    """Base class for payment processors"""
    
    def initiate_payment(self, payment):
        """Initiate payment with mobile money provider"""
        raise NotImplementedError
    
    def verify_payment(self, payment):
        """Verify payment status with mobile money provider"""
        raise NotImplementedError


class AirtelMoneyProcessor(PaymentProcessor):
    """Airtel Money payment processor"""
    
    def initiate_payment(self, payment):
        if settings.PAYMENT_SIMULATION_ENABLED:
            return simulate_provider_initiation(payment, 'airtel')

        try:
            url = f"{settings.AIRTEL_MONEY_API_URL}/payments/initiate"
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f"Bearer {self._get_access_token()}"
            }
            
            payload = {
                'amount': str(payment.amount),
                'phone_number': payment.phone_number,
                'transaction_id': str(payment.id),
                'callback_url': f"{settings.API_PUBLIC_BASE_URL}/api/payments/callback/airtel/"
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            # Log transaction
            PaymentTransaction.objects.create(
                payment=payment,
                transaction_type='initiate',
                request_data=payload,
                response_data=response.json() if response.content else {},
                status_code=response.status_code
            )
            
            if response.status_code == 200:
                data = response.json()
                payment.transaction_id = data.get('transaction_id')
                payment.external_reference = data.get('reference')
                payment.status = 'processing'
                payment.save()
                return True, data
            else:
                payment.status = 'failed'
                payment.failure_reason = f"API Error: {response.status_code}"
                payment.save()
                return False, response.json() if response.content else {}
                
        except Exception as e:
            payment.status = 'failed'
            payment.failure_reason = str(e)
            payment.save()
            return False, {'error': str(e)}
    
    def _get_access_token(self):
        """Get access token for Airtel Money API"""
        # This would typically involve OAuth2 flow
        # For now, return a placeholder
        return "airtel_access_token_placeholder"


class MTNMoneyProcessor(PaymentProcessor):
    """MTN Mobile Money payment processor"""
    
    def initiate_payment(self, payment):
        if settings.PAYMENT_SIMULATION_ENABLED:
            return simulate_provider_initiation(payment, 'mtn')

        try:
            url = f"{settings.MTN_MONEY_API_URL}/payments"
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f"Bearer {self._get_access_token()}"
            }
            
            payload = {
                'amount': str(payment.amount),
                'currency': 'RWF',  # Rwanda Franc
                'phone_number': payment.phone_number,
                'transaction_id': str(payment.id),
                'callback_url': f"{settings.API_PUBLIC_BASE_URL}/api/payments/callback/mtn/"
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            # Log transaction
            PaymentTransaction.objects.create(
                payment=payment,
                transaction_type='initiate',
                request_data=payload,
                response_data=response.json() if response.content else {},
                status_code=response.status_code
            )
            
            if response.status_code == 200:
                data = response.json()
                payment.transaction_id = data.get('transaction_id')
                payment.external_reference = data.get('reference')
                payment.status = 'processing'
                payment.save()
                return True, data
            else:
                payment.status = 'failed'
                payment.failure_reason = f"API Error: {response.status_code}"
                payment.save()
                return False, response.json() if response.content else {}
                
        except Exception as e:
            payment.status = 'failed'
            payment.failure_reason = str(e)
            payment.save()
            return False, {'error': str(e)}
    
    def _get_access_token(self):
        """Get access token for MTN Money API"""
        # This would typically involve OAuth2 flow
        # For now, return a placeholder
        return "mtn_access_token_placeholder"


def get_payment_processor(payment_method):
    """Get the appropriate payment processor"""
    processors = {
        'airtel': AirtelMoneyProcessor(),
        'mtn': MTNMoneyProcessor(),
    }
    return processors.get(payment_method)


def simulate_provider_initiation(payment, provider):
    """Create a provider-like response for local development."""
    transaction_id = f"SIM-{provider.upper()}-{uuid.uuid4().hex[:12]}"
    response_data = {
        'transaction_id': transaction_id,
        'reference': str(payment.id),
        'status': 'processing',
        'provider': provider,
        'simulated': True,
    }

    PaymentTransaction.objects.create(
        payment=payment,
        transaction_type='initiate',
        request_data={
            'amount': str(payment.amount),
            'phone_number': payment.phone_number,
            'provider': provider,
            'simulated': True,
        },
        response_data=response_data,
        status_code=200
    )

    payment.transaction_id = transaction_id
    payment.external_reference = str(payment.id)
    payment.status = 'processing'
    payment.save()
    return True, response_data


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def initiate_payment(request):
    """Initiate a new payment"""
    serializer = PaymentInitiateSerializer(data=request.data)
    if serializer.is_valid():
        plan = serializer.validated_data['plan_id']
        payment_method = serializer.validated_data['payment_method']
        phone_number = serializer.validated_data['phone_number']
        
        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            plan=plan,
            amount=plan.price,
            payment_method=payment_method,
            phone_number=phone_number,
            status='pending'
        )
        
        # Process payment
        processor = get_payment_processor(payment_method)
        if processor:
            success, response_data = processor.initiate_payment(payment)
            if success:
                return Response({
                    'message': 'Payment initiated successfully',
                    'payment': PaymentSerializer(payment).data,
                    'provider_response': response_data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Payment initiation failed',
                    'details': response_data
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(
                {'error': 'Invalid payment method'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_status(request, payment_id):
    """Check payment status"""
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        serializer = PaymentSerializer(payment)
        return Response(serializer.data)
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Payment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_payments(request):
    """Get user's payment history"""
    payments = Payment.objects.filter(user=request.user).order_by('-created_at')
    serializer = PaymentSerializer(payments, many=True)
    return Response({
        'payments': serializer.data,
        'count': payments.count()
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def payment_callback(request, provider):
    """Handle payment callbacks from mobile money providers"""
    try:
        data = json.loads(request.body) if request.body else {}
        transaction_id = data.get('transaction_id')
        
        if not transaction_id:
            return Response(
                {'error': 'Transaction ID required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            payment = Payment.objects.get(external_reference=transaction_id)
        except Payment.DoesNotExist:
            # Try to find by our transaction ID
            try:
                payment = Payment.objects.get(id=transaction_id)
            except Payment.DoesNotExist:
                return Response(
                    {'error': 'Payment not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Log callback
        PaymentTransaction.objects.create(
            payment=payment,
            transaction_type='callback',
            request_data={},
            response_data=data,
            status_code=200
        )
        
        # Update payment status based on callback
        callback_status = data.get('status', 'unknown').lower()
        if callback_status == 'successful' or callback_status == 'completed':
            payment.status = 'completed'
            # Here you would typically activate the user's WiFi session
        elif callback_status == 'failed':
            payment.status = 'failed'
            payment.failure_reason = data.get('reason', 'Payment failed')
        
        payment.save()
        
        return Response({'status': 'callback processed'}, status=status.HTTP_200_OK)
        
    except json.JSONDecodeError:
        return Response(
            {'error': 'Invalid JSON'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def simulate_payment(request, payment_id):
    """Simulate payment completion (for testing)"""
    if not (settings.DEBUG or settings.PAYMENT_SIMULATION_ENABLED):
        return Response(
            {'error': 'This endpoint is only available when payment simulation is enabled'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        payment.status = 'completed'
        payment.transaction_id = f"SIM_{uuid.uuid4().hex[:12]}"
        payment.save()
        
        return Response({
            'message': 'Payment simulated successfully',
            'payment': PaymentSerializer(payment).data
        })
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Payment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
