from rest_framework import viewsets, permissions
from .models import JobRole
from .serializers import JobRoleSerializer
from rest_framework.exceptions import PermissionDenied

class JobRoleViewSet(viewsets.ModelViewSet):
    serializer_class = JobRoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Workers can only see their own job roles
        if hasattr(self.request.user, 'worker_profile'):
            return JobRole.objects.filter(worker=self.request.user.worker_profile)
        return JobRole.objects.none()

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'worker_profile'):
            raise PermissionDenied("Only workers can create job roles.")
        serializer.save(worker=self.request.user.worker_profile)

from .serializers import PublicJobRoleSerializer
from django.db.models import Q

class PublicJobRoleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicJobRoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = JobRole.objects.filter(is_active=True).select_related('worker', 'worker__user')
        
        if getattr(self, 'action', None) == 'retrieve':
            return queryset
            
        # Filter by category if provided
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
            
        # Filter by specific worker if provided
        worker_id = self.request.query_params.get('worker_id', None)
        if worker_id:
            queryset = queryset.filter(worker__user__id=worker_id)
        elif hasattr(self.request.user, 'worker_profile'):
            # Only exclude current user if we are not specifically viewing a worker's roles
            queryset = queryset.exclude(worker=self.request.user.worker_profile)
            
        return queryset
