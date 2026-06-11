from rest_framework import generics, permissions
from .models import JobRequest
from .serializers import JobRequestSerializer, JobRequestCreateSerializer

class JobRequestListCreateView(generics.ListCreateAPIView):
    """
    GET: Lists pending/upcoming jobs for the authenticated user (Client or Worker).
    POST: Submits a new booking form (Client only).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return JobRequestCreateSerializer
        return JobRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', '') == 'Worker':
            # Worker sees jobs assigned to them
            return JobRequest.objects.filter(worker__user=user).order_by('-created_at')
        # Client sees jobs they requested
        return JobRequest.objects.filter(client=user).order_by('-created_at')

    def perform_create(self, serializer):
        # Automatically associate the logged-in client with the booking
        serializer.save(client=self.request.user)

class JobRequestDetailView(generics.RetrieveUpdateAPIView):
    """
    Allows retrieving details or updating the status (Pending, Accepted, Completed) of a specific job.
    """
    serializer_class = JobRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Restrict detail view to the client who created it or the worker assigned to it
        if getattr(user, 'role', '') == 'Worker':
            return JobRequest.objects.filter(worker__user=user)
        return JobRequest.objects.filter(client=user)
