from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, LogoutView, SessionCheckView, CSRFTokenView, 
    SwitchRoleView, DeleteAccountView, CustomerProfileView, 
    WorkerProfileDetailView, FeaturedWorkersView, GoogleLoginView, 
    VerifyOTPView, ResendOTPView, ReviewViewSet, DeviceTokenView
)

app_name = 'users'

router = DefaultRouter()
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend_otp'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('session/', SessionCheckView.as_view(), name='session_check'),
    path('csrf/', CSRFTokenView.as_view(), name='csrf_cookie'),
    path('switch-role/', SwitchRoleView.as_view(), name='switch_role'),
    path('device-token/', DeviceTokenView.as_view(), name='device_token'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete_account'),
    path('customer-profile/', CustomerProfileView.as_view(), name='customer_profile'),
    path('worker-profile/', WorkerProfileDetailView.as_view(), name='worker_profile_self'),
    path('worker-profile/<int:id>/', WorkerProfileDetailView.as_view(), name='worker_profile_detail'),
    path('featured-workers/', FeaturedWorkersView.as_view(), name='featured_workers'),
    path('google-login/', GoogleLoginView.as_view(), name='google_login'),
]
