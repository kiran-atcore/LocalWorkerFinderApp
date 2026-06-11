from django.urls import path
from .views import CategoryListView, WorkerProfileListView, WorkerProfileDetailView, WorkerProfileManageView

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('workers/', WorkerProfileListView.as_view(), name='worker-list'),
    path('workers/<int:pk>/', WorkerProfileDetailView.as_view(), name='worker-detail'),
    path('worker/profile/', WorkerProfileManageView.as_view(), name='worker-profile-manage'),
]