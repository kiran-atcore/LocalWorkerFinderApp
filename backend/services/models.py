from django.db import models
from django.conf import settings

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class WorkerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='worker_profile')
    categories = models.ManyToManyField(Category, related_name='workers')
    bio = models.TextField()
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2)
    location_lat = models.FloatField(null=True, blank=True)
    location_lng = models.FloatField(null=True, blank=True)
    rating = models.FloatField(default=0.0)

    def __str__(self):
        return f"Worker Profile: {self.user.username}"

class PortfolioImage(models.Model):
    worker = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name='portfolio_images')
    image = models.ImageField(upload_to='portfolio_images/')
    caption = models.CharField(max_length=255, blank=True)