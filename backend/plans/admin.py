from django.contrib import admin
from .models import Plan, PlanFeature


class PlanFeatureInline(admin.TabularInline):
    model = PlanFeature
    extra = 1
    min_num = 0


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'duration_display', 'is_active', 'sort_order', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    list_editable = ('is_active', 'sort_order')
    ordering = ('sort_order', 'price')
    inlines = [PlanFeatureInline]
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'description', 'price')
        }),
        ('Duration', {
            'fields': ('duration_hours', 'duration_display')
        }),
        ('Settings', {
            'fields': ('is_active', 'sort_order')
        }),
    )


@admin.register(PlanFeature)
class PlanFeatureAdmin(admin.ModelAdmin):
    list_display = ('plan', 'feature_name', 'is_included')
    list_filter = ('is_included', 'plan')
    search_fields = ('feature_name', 'plan__name')
    list_editable = ('is_included',)
