from django.db import models
from django.conf import settings
from django.utils import timezone
from plans.models import Plan
from payments.models import Payment
import uuid
import secrets
import string


def generate_access_code():
    alphabet = string.ascii_uppercase + string.digits
    first = ''.join(secrets.choice(alphabet) for _ in range(5))
    second = ''.join(secrets.choice(alphabet) for _ in range(5))
    return f"WIFI-{first}-{second}"


class WiFiSession(models.Model):
    """WiFi user sessions"""
    SESSION_STATUS = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('terminated', 'Terminated'),
        ('paused', 'Paused'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wifi_sessions')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='sessions')
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, related_name='session')
    mac_address = models.CharField(max_length=17, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=SESSION_STATUS, default='active')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField()
    data_used = models.BigIntegerField(default=0)  # in bytes
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'WiFi Session'
        verbose_name_plural = 'WiFi Sessions'
    
    def __str__(self):
        return f"{self.user.username} - {self.plan.name} ({self.status})"
    
    @property
    def is_active(self):
        from django.utils import timezone
        return (self.status == 'active' and 
                self.end_time > timezone.now())
    
    @property
    def time_remaining(self):
        from django.utils import timezone
        if self.end_time > timezone.now():
            return self.end_time - timezone.now()
        return timezone.timedelta(0)
    
    @property
    def duration_used(self):
        from django.utils import timezone
        return timezone.now() - self.start_time


class AccessToken(models.Model):
    """Customer WiFi access code used by support and captive portal login."""
    TOKEN_STATUS = [
        ('active', 'Active'),
        ('redeemed', 'Redeemed'),
        ('expired', 'Expired'),
        ('revoked', 'Revoked'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=32, unique=True, default=generate_access_code)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='access_tokens')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='access_tokens')
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, related_name='access_tokens')
    session = models.ForeignKey(WiFiSession, on_delete=models.SET_NULL, blank=True, null=True, related_name='access_tokens')
    phone_number = models.CharField(max_length=20, blank=True)
    mac_address = models.CharField(max_length=17, blank=True, null=True)
    status = models.CharField(max_length=20, choices=TOKEN_STATUS, default='active')
    expires_at = models.DateTimeField()
    regenerated_from = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='regenerated_tokens'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Access Token'
        verbose_name_plural = 'Access Tokens'

    def __str__(self):
        return f"{self.code} - {self.phone_number or self.user.username}"

    @property
    def is_usable(self):
        return self.status in ['active', 'redeemed'] and self.expires_at > timezone.now()

    @classmethod
    def create_for_payment(cls, payment, session=None, mac_address=None):
        expires_at = timezone.now() + timezone.timedelta(hours=payment.plan.duration_hours)
        return cls.objects.create(
            user=payment.user,
            plan=payment.plan,
            payment=payment,
            session=session,
            phone_number=payment.phone_number,
            mac_address=mac_address,
            expires_at=expires_at,
            status='active'
        )

    def regenerate(self):
        self.status = 'revoked'
        self.save(update_fields=['status', 'updated_at'])
        return AccessToken.objects.create(
            user=self.user,
            plan=self.plan,
            payment=self.payment,
            session=self.session,
            phone_number=self.phone_number,
            mac_address=None,
            expires_at=self.expires_at,
            regenerated_from=self,
            status='active'
        )


class SessionActivity(models.Model):
    """Track user activity during sessions"""
    session = models.ForeignKey(WiFiSession, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50)  # 'login', 'logout', 'data_usage', etc.
    data_amount = models.BigIntegerField(default=0)  # in bytes
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Session Activity'
        verbose_name_plural = 'Session Activities'
    
    def __str__(self):
        return f"{self.session.user.username} - {self.activity_type}"


class NetworkDevice(models.Model):
    """Track network devices/MAC addresses"""
    DEVICE_STATUS = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('blocked', 'Blocked'),
    ]
    
    mac_address = models.CharField(max_length=17, unique=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                           blank=True, null=True, related_name='devices')
    status = models.CharField(max_length=20, choices=DEVICE_STATUS, default='offline')
    device_info = models.JSONField(default=dict, blank=True)
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-last_seen']
        verbose_name = 'Network Device'
        verbose_name_plural = 'Network Devices'
    
    def __str__(self):
        return f"{self.mac_address} ({self.status})"
