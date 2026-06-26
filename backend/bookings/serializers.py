from rest_framework import serializers
from .models import Booking

class BookingSerializer(serializers.ModelSerializer):
    job_role_details = serializers.SerializerMethodField()
    customer_details = serializers.SerializerMethodField()
    worker_details = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'customer', 'worker', 'job_role', 
            'problem_description', 'negotiated_price', 
            'preferred_date', 'preferred_time', 
            'latitude', 'longitude', 'address_text',
            'status', 'worker_confirmed', 'customer_confirmed',
            'customer_completed', 'worker_completed',
            'created_at', 'updated_at',
            'job_role_details', 'customer_details', 'worker_details'
        ]
        read_only_fields = ['status', 'worker_confirmed', 'customer_confirmed', 'customer_completed', 'worker_completed', 'customer', 'worker']

    def get_job_role_details(self, obj):
        return {
            'id': obj.job_role.id,
            'category': obj.job_role.category,
            'hourly_rate': str(obj.job_role.hourly_rate),
        }

    def get_customer_details(self, obj):
        return {
            'id': obj.customer.id,
            'user_id': obj.customer.user.id,
            'name': f"{obj.customer.user.first_name} {obj.customer.user.last_name}".strip(),
            'profile_photo': obj.customer.profile_photo.url if obj.customer.profile_photo else None,
        }

    def get_worker_details(self, obj):
        return {
            'id': obj.worker.id,
            'user_id': obj.worker.user.id,
            'name': obj.worker.business_name or f"{obj.worker.user.first_name} {obj.worker.user.last_name}".strip(),
            'profile_photo': obj.worker.profile_photo.url if obj.worker.profile_photo else None,
        }

from .models import JobVacancy, JobApplication

class JobApplicationSerializer(serializers.ModelSerializer):
    worker_details = serializers.SerializerMethodField()

    vacancy_details = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        fields = ['id', 'vacancy', 'worker', 'comment', 'status', 'created_at', 'updated_at', 'worker_details', 'vacancy_details']
        read_only_fields = ['status']

    def get_worker_details(self, obj):
        request = self.context.get('request')
        photo_url = obj.worker.profile_photo.url if obj.worker.profile_photo else None
        if photo_url and request:
            photo_url = request.build_absolute_uri(photo_url)
            
        return {
            'id': obj.worker.id,
            'user_id': obj.worker.user.id,
            'name': obj.worker.business_name or f"{obj.worker.user.first_name} {obj.worker.user.last_name}".strip(),
            'profile_photo': photo_url,
            'rating': obj.worker.rating,
        }

    def get_vacancy_details(self, obj):
        return {
            'title': obj.vacancy.title,
            'remuneration': obj.vacancy.remuneration,
            'category': obj.vacancy.category,
            'is_active': obj.vacancy.is_active,
            'skills_required': obj.vacancy.skills_required,
        }

class JobVacancySerializer(serializers.ModelSerializer):
    customer_details = serializers.SerializerMethodField()
    applications = JobApplicationSerializer(many=True, read_only=True)
    applications_count = serializers.SerializerMethodField()
    has_applied = serializers.SerializerMethodField()
    application_status = serializers.SerializerMethodField()
    application_id = serializers.SerializerMethodField()

    class Meta:
        model = JobVacancy
        fields = [
            'id', 'customer', 'title', 'category', 'skills_required', 'experience_required', 
            'remuneration', 'description', 'latitude', 'longitude', 'address_text', 
            'is_active', 'contact_email', 'created_at', 'updated_at', 'customer_details', 'applications', 'applications_count', 'has_applied', 'application_status', 'application_id'
        ]
        read_only_fields = ['customer']

    def get_customer_details(self, obj):
        request = self.context.get('request')
        photo_url = obj.customer.profile_photo.url if obj.customer.profile_photo else None
        if photo_url and request:
            photo_url = request.build_absolute_uri(photo_url)
            
        return {
            'id': obj.customer.id,
            'user_id': obj.customer.user.id,
            'username': obj.customer.user.username,
            'first_name': obj.customer.user.first_name,
            'last_name': obj.customer.user.last_name,
            'name': f"{obj.customer.user.first_name} {obj.customer.user.last_name}".strip(),
            'email': obj.customer.user.email,
            'profile_photo': photo_url,
        }

    def get_applications_count(self, obj):
        return obj.applications.count()

    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and hasattr(request.user, 'worker_profile'):
            return obj.applications.filter(worker=request.user.worker_profile).exists()
        return False

    def get_application_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and hasattr(request.user, 'worker_profile'):
            app = obj.applications.filter(worker=request.user.worker_profile).first()
            return app.status if app else None
        return None

    def get_application_id(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and hasattr(request.user, 'worker_profile'):
            app = obj.applications.filter(worker=request.user.worker_profile).first()
            return app.id if app else None
        return None
