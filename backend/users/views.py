from rest_framework import status, views, permissions
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.contrib.auth.models import User
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer

import random
from .models import EmailOTP, CustomerProfile

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = str(random.randint(100000, 999999))
            
            print(f"=====================================")
            print(f"OTP FOR {email}: {otp}")
            print(f"=====================================")

            # Store OTP and registration data
            EmailOTP.objects.update_or_create(
                email=email,
                defaults={
                    'otp_code': otp,
                    'registration_data': request.data,
                    'attempts': 0
                }
            )

            # --- REAL EMAIL OTP SETUP (COMMENTED OUT) ---
            # from django.core.mail import send_mail
            # from django.conf import settings
            # try:
            #     send_mail(
            #         subject='Your Registration OTP',
            #         message=f'Your verification code is {otp}. This code will expire in 4 minutes.',
            #         from_email=settings.DEFAULT_FROM_EMAIL,
            #         recipient_list=[email],
            #         fail_silently=False,
            #     )
            # except Exception as e:
            #     print(f"Failed to send email: {e}")
            # --------------------------------------------

            return Response({
                "message": "OTP sent to email.",
                "email": email
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        otp_code = request.data.get('otp_code')

        if not email or not otp_code:
            return Response({"error": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            otp_record = EmailOTP.objects.get(email=email)
        except EmailOTP.DoesNotExist:
            return Response({"error": "No OTP found for this email."}, status=status.HTTP_404_NOT_FOUND)

        if otp_record.is_expired():
            return Response({"error": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)

        if str(otp_record.otp_code) != str(otp_code):
            otp_record.attempts += 1
            otp_record.save()
            if otp_record.attempts >= 3:
                otp_record.delete()
                return Response({"error": "Max attempts reached. Please register again."}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": f"Invalid OTP. {3 - otp_record.attempts} attempts remaining."}, status=status.HTTP_400_BAD_REQUEST)

        # OTP matches
        # Call serializer's create method manually
        serializer = RegisterSerializer(data=otp_record.registration_data)
        if serializer.is_valid():
            user = serializer.save()
            login(request, user)
            otp_record.delete()
            return Response({
                "message": "User created successfully.",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResendOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            otp_record = EmailOTP.objects.get(email=email)
        except EmailOTP.DoesNotExist:
            return Response({"error": "No registration in progress for this email."}, status=status.HTTP_404_NOT_FOUND)

        otp = str(random.randint(100000, 999999))
        otp_record.otp_code = otp
        otp_record.attempts = 0
        from django.utils import timezone
        otp_record.created_at = timezone.now()
        otp_record.save()

        print(f"=====================================")
        print(f"NEW OTP FOR {email}: {otp}")
        print(f"=====================================")

        # --- REAL EMAIL OTP SETUP (COMMENTED OUT) ---
        # from django.core.mail import send_mail
        # from django.conf import settings
        # try:
        #     send_mail(
        #         subject='Your New Registration OTP',
        #         message=f'Your new verification code is {otp}. This code will expire in 4 minutes.',
        #         from_email=settings.DEFAULT_FROM_EMAIL,
        #         recipient_list=[email],
        #         fail_silently=False,
        #     )
        # except Exception as e:
        #     print(f"Failed to send email: {e}")
        # --------------------------------------------

        return Response({"message": "OTP resent successfully."}, status=status.HTTP_200_OK)

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

@method_decorator(ensure_csrf_cookie, name='dispatch')
class GoogleLoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        token = request.data.get('id_token')
        if not token:
            return Response({"error": "No id_token provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # We skip audience verification here so we can support multiple mobile Client IDs easily.
            # But we verify the token's signature via Google's libraries.
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), audience=None)
            
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')

            email = idinfo.get('email')
            if not email:
                return Response({"error": "No email provided by Google."}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.filter(email=email).first()
            if not user:
                user = User.objects.filter(username=email).first()
            
            if not user:
                user = User.objects.create(
                    username=email,
                    email=email,
                    first_name=idinfo.get('given_name', ''),
                    last_name=idinfo.get('family_name', '')
                )
                user.set_unusable_password()
                user.save()
                
                from .models import CustomerProfile
                CustomerProfile.objects.create(user=user)

            login(request, user)
            return Response({
                "message": "Login successful.",
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response({"error": f"Invalid token: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Catch TransportError and other network issues gracefully
            return Response({"error": f"Server verification failed: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

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
            is_first_time = False
            if not hasattr(user, 'worker_profile'):
                is_first_time = True
                from .models import WorkerProfile
                worker_profile = WorkerProfile.objects.create(user=user)
                if hasattr(user, 'customer_profile') and user.customer_profile.profile_photo:
                    worker_profile.profile_photo = user.customer_profile.profile_photo
                    worker_profile.save()
            return Response({"message": "Switched to worker mode.", "active_role": "worker", "is_first_time": is_first_time}, status=status.HTTP_200_OK)
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

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import CustomerProfileSerializer, WorkerProfileSerializer
from .models import CustomerProfile, WorkerProfile

class CustomerProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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
