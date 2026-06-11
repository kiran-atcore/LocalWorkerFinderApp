from django.urls import path
from .views import LoginView, LogoutView, RegisterView, UserDetailView, GetCSRFToken

urlpatterns = [
    path('csrf/', GetCSRFToken.as_view(), name='csrf'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
]