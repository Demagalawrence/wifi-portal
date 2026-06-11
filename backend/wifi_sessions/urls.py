from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_session, name='create_session'),
    path('token/connect/', views.connect_with_token, name='connect_with_token'),
    path('current/', views.current_session, name='current_session'),
    path('history/', views.session_history, name='session_history'),
    path('<uuid:session_id>/', views.update_session, name='update_session'),
    path('<uuid:session_id>/terminate/', views.terminate_session, name='terminate_session'),
    path('<uuid:session_id>/activities/', views.session_activities, name='session_activities'),
    path('devices/', views.user_devices, name='user_devices'),
    path('devices/register/', views.register_device, name='register_device'),
    path('admin/active/', views.active_sessions, name='active_sessions'),
    path('admin/cleanup/', views.cleanup_expired_sessions, name='cleanup_expired_sessions'),
]
