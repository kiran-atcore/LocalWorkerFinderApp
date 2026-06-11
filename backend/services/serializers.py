from rest_framework import serializers
from .models import Category, WorkerProfile, PortfolioImage
from users.serializers import UserSerializer

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class PortfolioImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioImage
        fields = ['id', 'image', 'caption']

class WorkerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = WorkerProfile
        fields = ['id', 'user', 'categories', 'hourly_rate', 'rating', 'location_lat', 'location_lng']

class WorkerProfileDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    portfolio_images = PortfolioImageSerializer(many=True, read_only=True)

    class Meta:
        model = WorkerProfile
        fields = ['id', 'user', 'categories', 'bio', 'hourly_rate', 'rating', 'location_lat', 'location_lng', 'portfolio_images']

class WorkerProfileUpdateSerializer(serializers.ModelSerializer):
    categories = serializers.PrimaryKeyRelatedField(many=True, queryset=Category.objects.all(), required=False)

    class Meta:
        model = WorkerProfile
        fields = ['categories', 'bio', 'hourly_rate', 'location_lat', 'location_lng']