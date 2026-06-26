from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import Booking
from .serializers import BookingSerializer

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # A user could be both a customer and a worker. 
        # Return all bookings associated with them.
        user = self.request.user
        queryset = Booking.objects.all()
        
        # Filter by their customer or worker profiles
        q_conditions = Q()
        if hasattr(user, 'customer_profile'):
            q_conditions |= Q(customer=user.customer_profile)
        if hasattr(user, 'worker_profile'):
            q_conditions |= Q(worker=user.worker_profile)
            
        return queryset.filter(q_conditions).distinct()

    def perform_create(self, serializer):
        customer = self.request.user.customer_profile
        job_role = serializer.validated_data['job_role']
        worker = job_role.worker
        serializer.save(customer=customer, worker=worker, status='PENDING')

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        booking = self.get_object()
        if not hasattr(request.user, 'worker_profile') or booking.worker != request.user.worker_profile:
            return Response({"error": "Only the assigned worker can accept this booking."}, status=status.HTTP_403_FORBIDDEN)
        
        if booking.status != 'PENDING':
            return Response({"error": f"Cannot accept a booking that is {booking.status}."}, status=status.HTTP_400_BAD_REQUEST)
            
        booking.worker_confirmed = True
        booking.status = 'ACCEPTED'
        booking.save()
        return Response(self.get_serializer(booking).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        booking = self.get_object()
        if not hasattr(request.user, 'worker_profile') or booking.worker != request.user.worker_profile:
            return Response({"error": "Only the assigned worker can reject this booking."}, status=status.HTTP_403_FORBIDDEN)
            
        if booking.status != 'PENDING':
            return Response({"error": f"Cannot reject a booking that is {booking.status}."}, status=status.HTTP_400_BAD_REQUEST)
            
        booking.status = 'REJECTED'
        booking.save()
        return Response(self.get_serializer(booking).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if not hasattr(request.user, 'customer_profile') or booking.customer != request.user.customer_profile:
            return Response({"error": "Only the customer can cancel this booking."}, status=status.HTTP_403_FORBIDDEN)
            
        if booking.status not in ['PENDING', 'ACCEPTED']:
            return Response({"error": f"Cannot cancel a booking that is {booking.status}. It can only be cancelled while PENDING or ACCEPTED."}, status=status.HTTP_400_BAD_REQUEST)
            
        booking.status = 'CANCELLED'
        booking.save()
        return Response(self.get_serializer(booking).data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        booking = self.get_object()
        if not hasattr(request.user, 'customer_profile') or booking.customer != request.user.customer_profile:
            return Response({"error": "Only the customer can confirm this booking."}, status=status.HTTP_403_FORBIDDEN)
            
        if booking.status != 'ACCEPTED':
            return Response({"error": f"Cannot confirm a booking that is {booking.status}. The worker must ACCEPT it first."}, status=status.HTTP_400_BAD_REQUEST)
            
        booking.customer_confirmed = True
        if booking.worker_confirmed and booking.customer_confirmed:
            booking.status = 'ACTIVE'
            
        booking.save()
        return Response(self.get_serializer(booking).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        booking = self.get_object()
        
        if booking.status != 'ACTIVE':
            return Response({"error": f"Cannot complete a booking that is {booking.status}. It must be ACTIVE."}, status=status.HTTP_400_BAD_REQUEST)

        # Identify who is making the request
        is_worker = hasattr(request.user, 'worker_profile') and booking.worker == request.user.worker_profile
        is_customer = hasattr(request.user, 'customer_profile') and booking.customer == request.user.customer_profile
        
        if not is_worker and not is_customer:
            return Response({"error": "You do not have permission to complete this booking."}, status=status.HTTP_403_FORBIDDEN)
            
        if is_worker:
            booking.worker_completed = True
        if is_customer:
            booking.customer_completed = True
            
        if booking.worker_completed and booking.customer_completed:
            booking.status = 'COMPLETED'
            
        booking.save()
        return Response(self.get_serializer(booking).data)

from .models import JobVacancy, JobApplication
from .serializers import JobVacancySerializer, JobApplicationSerializer
import math

def get_distance(lat1, lon1, lat2, lon2):
    R = 6371 # Radius of the earth in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

class JobVacancyViewSet(viewsets.ModelViewSet):
    serializer_class = JobVacancySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = JobVacancy.objects.all()

        if hasattr(user, 'worker_profile'):
            if self.action == 'list':
                # Workers see active vacancies
                worker_qs = queryset.filter(is_active=True)
                
                # Exclude vacancies posted by the current user (if they also have a customer profile)
                if hasattr(user, 'customer_profile'):
                    worker_qs = worker_qs.exclude(customer=user.customer_profile)
                    
                search = self.request.query_params.get('search', '')
                if search:
                    worker_qs = worker_qs.filter(
                        Q(category__icontains=search) | Q(description__icontains=search)
                    )
                return worker_qs
            elif self.action in ['retrieve', 'apply']:
                # Allow worker to retrieve active vacancies or closed vacancies they applied to
                if not hasattr(user, 'customer_profile'):
                    return queryset.filter(Q(is_active=True) | Q(applications__worker=user.worker_profile)).distinct()
                else:
                    return queryset.filter(Q(is_active=True) | Q(customer=user.customer_profile) | Q(applications__worker=user.worker_profile)).distinct()

        if hasattr(user, 'customer_profile'):
            # Customers see their own
            return queryset.filter(customer=user.customer_profile)
        
        return JobVacancy.objects.none()

    def perform_create(self, serializer):
        customer = self.request.user.customer_profile
        serializer.save(customer=customer)

    @action(detail=False, methods=['get'])
    def my_vacancies(self, request):
        if not hasattr(request.user, 'customer_profile'):
            return Response({"error": "Only customers can view their posted vacancies."}, status=status.HTTP_403_FORBIDDEN)
        
        vacancies = JobVacancy.objects.filter(customer=request.user.customer_profile)
        serializer = self.get_serializer(vacancies, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        vacancy = self.get_object()
        if not hasattr(request.user, 'worker_profile'):
            return Response({"error": "Only workers can apply."}, status=status.HTTP_403_FORBIDDEN)
        
        if not vacancy.is_active:
            return Response({"error": "This job vacancy is closed."}, status=status.HTTP_400_BAD_REQUEST)
        
        worker = request.user.worker_profile
        if JobApplication.objects.filter(vacancy=vacancy, worker=worker).exists():
            return Response({"error": "You have already applied."}, status=status.HTTP_400_BAD_REQUEST)

        comment = request.data.get('comment', '')
        application = JobApplication.objects.create(
            vacancy=vacancy,
            worker=worker,
            comment=comment,
            status='PENDING'
        )

        return Response(JobApplicationSerializer(application).data, status=status.HTTP_201_CREATED)

class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = self.request.query_params.get('role')

        if role == 'worker' and hasattr(user, 'worker_profile'):
            return JobApplication.objects.filter(worker=user.worker_profile)
        elif role == 'customer' and hasattr(user, 'customer_profile'):
            return JobApplication.objects.filter(vacancy__customer=user.customer_profile)

        if hasattr(user, 'customer_profile'):
            return JobApplication.objects.filter(vacancy__customer=user.customer_profile)
        if hasattr(user, 'worker_profile'):
            return JobApplication.objects.filter(worker=user.worker_profile)
        return JobApplication.objects.none()

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        application = self.get_object()
        if application.vacancy.customer != request.user.customer_profile:
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        application.status = 'ACCEPTED'
        application.save()
        return Response(self.get_serializer(application).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        application = self.get_object()
        if application.vacancy.customer != request.user.customer_profile:
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        application.status = 'REJECTED'
        application.save()
        return Response(self.get_serializer(application).data)
