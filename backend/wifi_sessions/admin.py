from django.contrib import admin
from .models import WiFiSession, SessionActivity, NetworkDevice, AccessToken


class SessionActivityInline(admin.TabularInline):
    model = SessionActivity
    extra = 0
    readonly_fields = ('timestamp',)
    can_delete = False


class AccessTokenInline(admin.TabularInline):
    model = AccessToken
    extra = 0
    readonly_fields = ('code', 'phone_number', 'status', 'expires_at', 'created_at')
    fields = ('code', 'phone_number', 'status', 'expires_at', 'created_at')
    can_delete = False


@admin.register(WiFiSession)
class WiFiSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'status', 'mac_address', 'ip_address', 
                   'start_time', 'end_time', 'data_used', 'is_active')
    list_filter = ('status', 'plan', 'created_at')
    search_fields = ('user__username', 'mac_address', 'ip_address')
    readonly_fields = ('id', 'created_at', 'updated_at', 'is_active', 
                      'time_remaining', 'duration_used')
    ordering = ('-created_at',)
    inlines = [SessionActivityInline, AccessTokenInline]
    
    fieldsets = (
        ('Session Info', {
            'fields': ('user', 'plan', 'payment', 'status')
        }),
        ('Network Info', {
            'fields': ('mac_address', 'ip_address')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time', 'last_activity')
        }),
        ('Usage', {
            'fields': ('data_used',)
        }),
        ('System Info', {
            'fields': ('is_active', 'time_remaining', 'duration_used', 
                      'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_active(self, obj):
        return obj.is_active
    is_active.boolean = True
    is_active.short_description = 'Active'


@admin.register(AccessToken)
class AccessTokenAdmin(admin.ModelAdmin):
    list_display = ('code', 'phone_number', 'user', 'plan', 'status', 'mac_address',
                    'expires_at', 'created_at')
    list_filter = ('status', 'plan', 'created_at', 'expires_at')
    search_fields = ('code', 'phone_number', 'user__username', 'mac_address',
                     'payment__transaction_id')
    readonly_fields = ('id', 'code', 'created_at', 'updated_at', 'regenerated_from')
    ordering = ('-created_at',)
    actions = ('regenerate_tokens', 'revoke_tokens')

    fieldsets = (
        ('Access Code', {
            'fields': ('code', 'status', 'expires_at', 'regenerated_from')
        }),
        ('Customer', {
            'fields': ('user', 'phone_number', 'mac_address')
        }),
        ('Purchase', {
            'fields': ('plan', 'payment', 'session')
        }),
        ('System Info', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    @admin.action(description='Regenerate selected access codes')
    def regenerate_tokens(self, request, queryset):
        regenerated = []
        for access_token in queryset:
            regenerated.append(access_token.regenerate())
        self.message_user(
            request,
            f"Regenerated {len(regenerated)} code(s): " +
            ", ".join(token.code for token in regenerated[:5])
        )

    @admin.action(description='Revoke selected access codes')
    def revoke_tokens(self, request, queryset):
        updated = queryset.update(status='revoked')
        self.message_user(request, f"Revoked {updated} access code(s).")


@admin.register(SessionActivity)
class SessionActivityAdmin(admin.ModelAdmin):
    list_display = ('session', 'activity_type', 'data_amount', 'timestamp')
    list_filter = ('activity_type', 'timestamp')
    search_fields = ('session__user__username', 'activity_type')
    readonly_fields = ('session', 'activity_type', 'data_amount', 
                      'timestamp', 'details')
    ordering = ('-timestamp',)
    
    def has_add_permission(self, request):
        return False


@admin.register(NetworkDevice)
class NetworkDeviceAdmin(admin.ModelAdmin):
    list_display = ('mac_address', 'user', 'ip_address', 'status', 
                   'first_seen', 'last_seen')
    list_filter = ('status', 'first_seen', 'last_seen')
    search_fields = ('mac_address', 'user__username', 'ip_address')
    readonly_fields = ('first_seen', 'last_seen')
    ordering = ('-last_seen',)
    
    fieldsets = (
        ('Device Info', {
            'fields': ('mac_address', 'ip_address', 'user', 'status')
        }),
        ('Details', {
            'fields': ('device_info',)
        }),
        ('Timestamps', {
            'fields': ('first_seen', 'last_seen'),
            'classes': ('collapse',)
        }),
    )
