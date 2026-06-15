from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobRoleViewSet, PublicJobRoleViewSet

router = DefaultRouter()
router.register(r'job-roles', JobRoleViewSet, basename='jobrole')
router.register(r'search/job-roles', PublicJobRoleViewSet, basename='public-jobrole')

urlpatterns = [
    path('', include(router.urls)),
]
