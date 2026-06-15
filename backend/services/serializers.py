from rest_framework import serializers
from .models import JobRole

class JobRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRole
        fields = ['id', 'worker', 'category', 'hourly_rate', 'experience_years', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['worker', 'created_at', 'updated_at']

from users.serializers import WorkerProfileSerializer

class PublicJobRoleSerializer(serializers.ModelSerializer):
    worker = WorkerProfileSerializer(read_only=True)
    
    class Meta:
        model = JobRole
        fields = ['id', 'worker', 'category', 'hourly_rate', 'experience_years', 'description']

