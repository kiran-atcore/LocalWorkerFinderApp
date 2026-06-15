from django.urls import path
from .views import RegisterView, LoginView, LogoutView, SessionCheckView, CSRFTokenView, SwitchRoleView, DeleteAccountView, CustomerProfileView, WorkerProfileDetailView, FeaturedWorkersView

app_name = 'users'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('session/', SessionCheckView.as_view(), name='session_check'),
    path('csrf/', CSRFTokenView.as_view(), name='csrf_cookie'),
    path('switch-role/', SwitchRoleView.as_view(), name='switch_role'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete_account'),
    path('customer-profile/', CustomerProfileView.as_view(), name='customer_profile'),
    path('worker-profile/', WorkerProfileDetailView.as_view(), name='worker_profile_self'),
    path('worker-profile/<int:id>/', WorkerProfileDetailView.as_view(), name='worker_profile_detail'),
    path('featured-workers/', FeaturedWorkersView.as_view(), name='featured_workers'),
]
