from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import CustomerProfile

class UserSerializer(serializers.ModelSerializer):
    has_worker_profile = serializers.SerializerMethodField()
    profile_photo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'has_worker_profile', 'profile_photo']

    def get_has_worker_profile(self, obj):
        return hasattr(obj, 'worker_profile')

    def get_profile_photo(self, obj):
        if hasattr(obj, 'worker_profile') and obj.worker_profile.profile_photo:
            return obj.worker_profile.profile_photo.url
        if hasattr(obj, 'customer_profile') and obj.customer_profile.profile_photo:
            return obj.customer_profile.profile_photo.url
        return None

from .models import CustomerProfile, WorkerProfile, Review
from django.db.models import Avg, Count

class CustomerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = CustomerProfile
        fields = ['id', 'user', 'profile_photo', 'latitude', 'longitude', 'address_text', 'created_at']

class ReviewSerializer(serializers.ModelSerializer):
    customer = CustomerProfileSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'worker', 'customer', 'skill_rating', 'performance_rating', 
                  'service_quality_rating', 'friendly_rating', 'cost_efficiency_rating', 
                  'overall_rating', 'review_text', 'created_at', 'updated_at']
        read_only_fields = ['overall_rating', 'customer']

class WorkerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    review_stats = serializers.SerializerMethodField()
    has_reviewed = serializers.SerializerMethodField()

    class Meta:
        model = WorkerProfile
        fields = ['id', 'user', 'profile_photo', 'business_name', 'bio', 'skills', 'rating', 'total_earnings', 'latitude', 'longitude', 'address_text', 'created_at', 'review_stats', 'has_reviewed']
        read_only_fields = ['rating', 'total_earnings']

    def get_review_stats(self, obj):
        reviews = obj.reviews.all()
        if not reviews.exists():
            return None
        
        stats = reviews.aggregate(
            skill=Avg('skill_rating'),
            performance=Avg('performance_rating'),
            service_quality=Avg('service_quality_rating'),
            friendly=Avg('friendly_rating'),
            cost_efficiency=Avg('cost_efficiency_rating'),
            total_reviews=Count('id')
        )
        return {
            'skill': round(stats['skill'] or 0, 1),
            'performance': round(stats['performance'] or 0, 1),
            'service_quality': round(stats['service_quality'] or 0, 1),
            'friendly': round(stats['friendly'] or 0, 1),
            'cost_efficiency': round(stats['cost_efficiency'] or 0, 1),
            'total_reviews': stats['total_reviews']
        }
        
    def get_has_reviewed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and hasattr(request.user, 'customer_profile'):
            return obj.reviews.filter(customer=request.user.customer_profile).exists()
        return False

class FeaturedWorkerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    categories = serializers.SerializerMethodField()

    class Meta:
        model = WorkerProfile
        fields = ['id', 'user', 'profile_photo', 'business_name', 'rating', 'categories', 'latitude', 'longitude']

    def get_categories(self, obj):
        # Return unique categories of active job roles
        return list(obj.job_roles.filter(is_active=True).values_list('category', flat=True).distinct())

class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(required=True, write_only=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['full_name', 'email', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def create(self, validated_data):
        full_name = validated_data.pop('full_name')
        email = validated_data.get('email')
        password = validated_data.get('password')
        
        # Split full name into first and last name roughly
        names = full_name.split(' ', 1)
        first_name = names[0]
        last_name = names[1] if len(names) > 1 else ''

        user = User.objects.create_user(
            username=email, # Using email as username for simplicity
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Automatically assign Customer Profile
        CustomerProfile.objects.create(user=user)
        
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'), username=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid credentials.")
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'.")
            
        data['user'] = user
        return data
