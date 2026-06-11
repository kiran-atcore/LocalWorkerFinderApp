from rest_framework import generics, permissions
from .models import Category, WorkerProfile
from .serializers import CategorySerializer, WorkerProfileSerializer, WorkerProfileDetailSerializer, WorkerProfileUpdateSerializer

class CategoryListView(generics.ListAPIView):
    """
    Returns a list of all service categories.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class WorkerProfileListView(generics.ListAPIView):
    """
    Returns a list of workers. Allows filtering by category.
    """
    serializer_class = WorkerProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = WorkerProfile.objects.all()
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(categories__id=category_id)
        return queryset

class WorkerProfileDetailView(generics.RetrieveAPIView):
    """
    Returns the detailed bio, hourly rate, and portfolio of a specific worker.
    """
    queryset = WorkerProfile.objects.all()
    serializer_class = WorkerProfileDetailSerializer
    permission_classes = [permissions.AllowAny]

class WorkerProfileManageView(generics.RetrieveUpdateAPIView):
    """
    Allows a logged-in Worker to retrieve and update their own profile details.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return WorkerProfileUpdateSerializer
        return WorkerProfileDetailSerializer

    def get_object(self):
        # Ensure a profile exists for the worker or create one
        profile, _ = WorkerProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'bio': '', 'hourly_rate': 0.0}
        )
        return profile
