from django.urls import path
from . import views

urlpatterns = [
    path('initiate/', views.initiate_payment, name='initiate_payment'),
    path('<uuid:payment_id>/status/', views.payment_status, name='payment_status'),
    path('history/', views.user_payments, name='user_payments'),
    path('callback/<str:provider>/', views.payment_callback, name='payment_callback'),
    path('<uuid:payment_id>/simulate/', views.simulate_payment, name='simulate_payment'),
]
