from rest_framework import serializers
from django.utils import timezone
from .models import WiFiSession, SessionActivity, NetworkDevice, AccessToken


class WiFiSessionSerializer(serializers.ModelSerializer):
    """Serializer for WiFi sessions"""
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_duration = serializers.CharField(source='plan.duration_display', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    ip_address = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    is_active = serializers.BooleanField(read_only=True)
    time_remaining = serializers.DurationField(read_only=True)
    duration_used = serializers.DurationField(read_only=True)
    
    class Meta:
        model = WiFiSession
        fields = ('id', 'user', 'user_username', 'plan', 'plan_name', 'plan_duration',
                 'payment', 'mac_address', 'ip_address', 'status', 'start_time', 
                 'end_time', 'data_used', 'last_activity', 'is_active', 
                 'time_remaining', 'duration_used', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'payment', 'start_time', 'end_time', 
                           'data_used', 'last_activity', 'created_at', 'updated_at')


class SessionActivitySerializer(serializers.ModelSerializer):
    """Serializer for session activities"""
    class Meta:
        model = SessionActivity
        fields = ('activity_type', 'data_amount', 'timestamp', 'details')
        read_only_fields = ('timestamp',)


class NetworkDeviceSerializer(serializers.ModelSerializer):
    """Serializer for network devices"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    ip_address = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    class Meta:
        model = NetworkDevice
        fields = ('mac_address', 'ip_address', 'user', 'user_username', 'status', 
                 'device_info', 'first_seen', 'last_seen')
        read_only_fields = ('first_seen', 'last_seen')


class AccessTokenSerializer(serializers.ModelSerializer):
    """Serializer for customer WiFi access tokens."""
    user_username = serializers.CharField(source='user.username', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_duration = serializers.CharField(source='plan.duration_display', read_only=True)

    class Meta:
        model = AccessToken
        fields = ('id', 'code', 'user', 'user_username', 'plan', 'plan_name',
                  'plan_duration', 'payment', 'session', 'phone_number',
                  'mac_address', 'status', 'expires_at', 'regenerated_from',
                  'created_at', 'updated_at')
        read_only_fields = fields


class CreateSessionSerializer(serializers.Serializer):
    """Serializer for creating a new WiFi session"""
    payment_id = serializers.UUIDField()
    mac_address = serializers.CharField(max_length=17, required=False)
    
    def validate_payment_id(self, value):
        from payments.models import Payment
        try:
            payment = Payment.objects.get(id=value, status='completed')
            # Check if payment already has an active session
            if payment.session.exists():
                raise serializers.ValidationError("Payment already has an active session")
            return payment
        except Payment.DoesNotExist:
            raise serializers.ValidationError("Invalid or unpaid payment")


class ConnectWithTokenSerializer(serializers.Serializer):
    """Serializer for connecting with an admin/customer access token."""
    code = serializers.CharField(max_length=32)
    mac_address = serializers.CharField(max_length=17, required=False, allow_blank=True)

    def validate_code(self, value):
        normalized = value.strip().upper()
        try:
            access_token = AccessToken.objects.select_related('user', 'plan', 'payment').get(code=normalized)
        except AccessToken.DoesNotExist:
            raise serializers.ValidationError("Invalid access token")

        if not access_token.is_usable:
            raise serializers.ValidationError("This access token is expired or revoked")

        return access_token


class SessionUpdateSerializer(serializers.Serializer):
    """Serializer for updating session status"""
    status = serializers.ChoiceField(choices=WiFiSession.SESSION_STATUS)
    data_used = serializers.IntegerField(required=False, min_value=0)
