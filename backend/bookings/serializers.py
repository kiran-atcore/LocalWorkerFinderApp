from rest_framework import serializers
from .models import JobRequest
from users.serializers import UserSerializer
from services.serializers import WorkerProfileSerializer

class JobRequestSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    worker = WorkerProfileSerializer(read_only=True)

    class Meta:
        model = JobRequest
        fields = '__all__'

class JobRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRequest
        # Client will be appended automatically in the view's perform_create method
        fields = ['worker', 'date', 'time', 'address', 'description']