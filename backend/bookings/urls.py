from django.urls import path
from .views import JobRequestListCreateView, JobRequestDetailView

urlpatterns = [
    path('', JobRequestListCreateView.as_view(), name='job-list-create'),
    path('<int:pk>/', JobRequestDetailView.as_view(), name='job-detail'),
]