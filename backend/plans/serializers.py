from rest_framework import serializers
from .models import Plan, PlanFeature


class PlanFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanFeature
        fields = ('feature_name', 'is_included')


class PlanSerializer(serializers.ModelSerializer):
    features = PlanFeatureSerializer(many=True, read_only=True)
    duration_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = Plan
        fields = ('id', 'name', 'description', 'price', 'duration_hours', 
                 'duration_display', 'features', 'is_active', 'sort_order')
        read_only_fields = ('id', 'created_at', 'updated_at')


class PlanDetailSerializer(PlanSerializer):
    """Detailed plan serializer for plan details view"""
    class Meta(PlanSerializer.Meta):
        fields = PlanSerializer.Meta.fields + ('created_at', 'updated_at')
