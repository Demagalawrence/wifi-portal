from django.db import models
import uuid


class Plan(models.Model):
    """WiFi hotspot pricing plans"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_hours = models.IntegerField()  # Duration in hours
    duration_display = models.CharField(max_length=50)  # e.g., "2 hours", "1 week"
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['sort_order', 'price']
        verbose_name = 'Plan'
        verbose_name_plural = 'Plans'
    
    def __str__(self):
        return f"{self.name} - {self.price}/-"
    
    @property
    def duration_in_seconds(self):
        return self.duration_hours * 3600


class PlanFeature(models.Model):
    """Features included in plans"""
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='features')
    feature_name = models.CharField(max_length=100)
    is_included = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Plan Feature'
        verbose_name_plural = 'Plan Features'
    
    def __str__(self):
        return f"{self.plan.name} - {self.feature_name}"
