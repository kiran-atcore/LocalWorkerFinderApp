from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, JobVacancyViewSet, JobApplicationViewSet

router = DefaultRouter()
router.register(r'vacancies', JobVacancyViewSet, basename='jobvacancy')
router.register(r'applications', JobApplicationViewSet, basename='jobapplication')
router.register(r'', BookingViewSet, basename='booking')

urlpatterns = [
    path('', include(router.urls)),
]
