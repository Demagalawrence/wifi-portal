from rest_framework import serializers
from .models import Payment, PaymentTransaction
from plans.models import Plan


class PaymentInitiateSerializer(serializers.Serializer):
    """Serializer for initiating payment"""
    plan_id = serializers.UUIDField()
    payment_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHODS)
    phone_number = serializers.CharField(max_length=20)
    
    def validate_plan_id(self, value):
        try:
            plan = Plan.objects.get(id=value, is_active=True)
            return plan
        except Plan.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive plan")
    
    def validate_phone_number(self, value):
        # Basic phone number validation
        if not value or len(value) < 10:
            raise serializers.ValidationError("Invalid phone number")
        return value


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payment details"""
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_duration = serializers.CharField(source='plan.duration_display', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Payment
        fields = ('id', 'user', 'user_username', 'plan', 'plan_name', 'plan_duration',
                 'amount', 'payment_method', 'phone_number', 'transaction_id', 
                 'status', 'failure_reason', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'amount', 'transaction_id', 'status', 
                           'failure_reason', 'created_at', 'updated_at')


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Serializer for payment transactions"""
    class Meta:
        model = PaymentTransaction
        fields = ('transaction_type', 'request_data', 'response_data', 
                 'status_code', 'created_at')
        read_only_fields = ('created_at',)
