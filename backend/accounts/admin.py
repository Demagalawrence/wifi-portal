from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'phone_number', 'is_active_session', 'created_at')
    list_filter = ('is_active_session', 'is_staff', 'is_superuser', 'created_at')
    search_fields = ('username', 'email', 'phone_number')
    ordering = ('-created_at',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('WiFi Hotspot Info', {'fields': ('phone_number', 'is_active_session')}),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'mac_address', 'last_login_ip', 'total_sessions', 'total_spent')
    list_filter = ('total_sessions',)
    search_fields = ('user__username', 'mac_address', 'last_login_ip')
    readonly_fields = ('total_sessions', 'total_spent')
