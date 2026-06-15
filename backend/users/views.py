from rest_framework import status, views, permissions
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Automatically log the user in after registration (session-based)
            login(request, user)
            return Response({
                "message": "User created successfully.",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(ensure_csrf_cookie, name='dispatch')
class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            return Response({
                "message": "Login successful.",
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logout(request)
        return Response({"message": "Logout successful."}, status=status.HTTP_200_OK)

@method_decorator(ensure_csrf_cookie, name='dispatch')
class SessionCheckView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return Response({
                "isAuthenticated": True,
                "user": UserSerializer(request.user).data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "isAuthenticated": False,
                "user": None
            }, status=status.HTTP_200_OK)

class CSRFTokenView(views.APIView):
    permission_classes = [permissions.AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request, *args, **kwargs):
        from django.middleware.csrf import get_token
        return Response({'csrftoken': get_token(request)})

class SwitchRoleView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        role = request.data.get('role')

        if role == 'worker':
            if not hasattr(user, 'worker_profile'):
                from .models import WorkerProfile
                worker_profile = WorkerProfile.objects.create(user=user)
                if hasattr(user, 'customer_profile') and user.customer_profile.profile_photo:
                    worker_profile.profile_photo = user.customer_profile.profile_photo
                    worker_profile.save()
            return Response({"message": "Switched to worker mode.", "active_role": "worker"}, status=status.HTTP_200_OK)
        elif role == 'customer':
            return Response({"message": "Switched to customer mode.", "active_role": "customer"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid role."}, status=status.HTTP_400_BAD_REQUEST)

class DeleteAccountView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        user = request.user
        user.delete()
        logout(request)
        return Response({"message": "Account deleted successfully."}, status=status.HTTP_200_OK)

from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import CustomerProfileSerializer, WorkerProfileSerializer
from .models import CustomerProfile, WorkerProfile

class CustomerProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, *args, **kwargs):
        profile = request.user.customer_profile
        return Response(CustomerProfileSerializer(profile).data)

    def put(self, request, *args, **kwargs):
        profile = request.user.customer_profile
        serializer = CustomerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            full_name = request.data.get('full_name')
            if full_name:
                names = full_name.split(' ', 1)
                request.user.first_name = names[0]
                request.user.last_name = names[1] if len(names) > 1 else ''
                request.user.save()
            
            # Sync photo to worker profile if it exists
            if 'profile_photo' in request.data and hasattr(request.user, 'worker_profile'):
                request.user.worker_profile.profile_photo = profile.profile_photo
                request.user.worker_profile.save()

            return Response(CustomerProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class WorkerProfileDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, id=None, *args, **kwargs):
        if id:
            from django.shortcuts import get_object_or_404
            profile = get_object_or_404(WorkerProfile, user__id=id)
            return Response(WorkerProfileSerializer(profile).data)
        else:
            if not hasattr(request.user, 'worker_profile'):
                return Response({"error": "No worker profile."}, status=status.HTTP_404_NOT_FOUND)
            return Response(WorkerProfileSerializer(request.user.worker_profile).data)

    def put(self, request, *args, **kwargs):
        if not hasattr(request.user, 'worker_profile'):
            return Response({"error": "No worker profile."}, status=status.HTTP_404_NOT_FOUND)
        profile = request.user.worker_profile
        serializer = WorkerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            full_name = request.data.get('full_name')
            if full_name:
                names = full_name.split(' ', 1)
                request.user.first_name = names[0]
                request.user.last_name = names[1] if len(names) > 1 else ''
                request.user.save()
                
            # Sync photo to customer profile if it exists
            if 'profile_photo' in request.data and hasattr(request.user, 'customer_profile'):
                request.user.customer_profile.profile_photo = profile.profile_photo
                request.user.customer_profile.save()
                
            return Response(WorkerProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from django.db.models import Q, Count
from .serializers import FeaturedWorkerSerializer

class FeaturedWorkersView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Annotate with count of active job roles
        queryset = WorkerProfile.objects.annotate(
            active_jobs_count=Count('job_roles', filter=Q(job_roles__is_active=True))
        ).filter(active_jobs_count__gt=0).select_related('user').prefetch_related('job_roles')

        # Exclude the current user
        queryset = queryset.exclude(user=request.user)

        # Search functionality
        search_query = request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(business_name__icontains=search_query) |
                Q(job_roles__category__icontains=search_query)
            ).distinct()

        # Get top 20 or so
        workers = queryset[:20]
        return Response(FeaturedWorkerSerializer(workers, many=True, context={'request': request}).data)
