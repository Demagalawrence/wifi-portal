from django.urls import path
from . import views

urlpatterns = [
    path('', views.plan_list, name='plan_list'),
    path('<uuid:plan_id>/', views.plan_detail, name='plan_detail'),
    path('create/', views.create_plan, name='create_plan'),
    path('<uuid:plan_id>/update/', views.update_plan, name='update_plan'),
    path('<uuid:plan_id>/delete/', views.delete_plan, name='delete_plan'),
    path('<uuid:plan_id>/features/', views.add_plan_feature, name='add_plan_feature'),
]
