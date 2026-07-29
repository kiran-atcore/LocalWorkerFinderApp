from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, LogoutView, SessionCheckView, CSRFTokenView, 
    SwitchRoleView, DeleteAccountView, CustomerProfileView, 
    WorkerProfileDetailView, FeaturedWorkersView, GoogleLoginView, 
    VerifyOTPView, ResendOTPView, ReviewViewSet, DeviceTokenView, ResetDBView,
    ForgotPasswordOTPView, ResetPasswordView, VerifyResetOTPView,
    PendingWorkerRequestsView, ReviewWorkerRequestView, BannedWorkersView, UnbanWorkerView
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
    path('google-login/', GoogleLoginView.as_view(), name='google_login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('session/', SessionCheckView.as_view(), name='session_check'),
    path('csrf/', CSRFTokenView.as_view(), name='csrf_token'),
    path('switch-role/', SwitchRoleView.as_view(), name='switch_role'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete_account'),
    
    path('customer-profile/', CustomerProfileView.as_view(), name='customer_profile'),
    
    path('worker-profile/', WorkerProfileDetailView.as_view(), name='worker_profile_self'),
    path('worker-profile/<int:id>/', WorkerProfileDetailView.as_view(), name='worker_profile_detail'),
    path('workers/featured/', FeaturedWorkersView.as_view(), name='featured_workers'),
    
    # Admin Routes
    path('admin/pending-workers/', PendingWorkerRequestsView.as_view(), name='pending_workers'),
    path('admin/review-worker/', ReviewWorkerRequestView.as_view(), name='review_worker'),
    path('admin/banned-workers/', BannedWorkersView.as_view(), name='banned_workers'),
    path('admin/unban-worker/', UnbanWorkerView.as_view(), name='unban_worker'),

    path('forgot-password/', ForgotPasswordOTPView.as_view(), name='forgot_password'),
    path('verify-reset-otp/', VerifyResetOTPView.as_view(), name='verify_reset_otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('device-token/', DeviceTokenView.as_view(), name='device_token'),
    path('reset-db/', ResetDBView.as_view(), name='reset_db'),
]
