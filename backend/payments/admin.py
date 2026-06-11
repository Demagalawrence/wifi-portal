from django.contrib import admin
from .models import Payment, PaymentTransaction
from wifi_sessions.models import AccessToken


class PaymentTransactionInline(admin.TabularInline):
    model = PaymentTransaction
    extra = 0
    readonly_fields = ('created_at',)
    can_delete = False


class AccessTokenInline(admin.TabularInline):
    model = AccessToken
    extra = 0
    readonly_fields = ('code', 'phone_number', 'status', 'mac_address', 'expires_at', 'created_at')
    fields = ('code', 'phone_number', 'status', 'mac_address', 'expires_at', 'created_at')
    can_delete = False


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'amount', 'payment_method', 'phone_number', 
                   'status', 'transaction_id', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('user__username', 'phone_number', 'transaction_id')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    inlines = [PaymentTransactionInline, AccessTokenInline]
    
    fieldsets = (
        ('Payment Info', {
            'fields': ('user', 'plan', 'amount', 'payment_method', 'phone_number')
        }),
        ('Transaction Details', {
            'fields': ('transaction_id', 'external_reference', 'status', 'failure_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('payment', 'transaction_type', 'status_code', 'created_at')
    list_filter = ('transaction_type', 'status_code', 'created_at')
    search_fields = ('payment__user__username', 'payment__transaction_id')
    readonly_fields = ('payment', 'transaction_type', 'request_data', 
                      'response_data', 'status_code', 'created_at')
    ordering = ('-created_at',)
    
    def has_add_permission(self, request):
        return False
