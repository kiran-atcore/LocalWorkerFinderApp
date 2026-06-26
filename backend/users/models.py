from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class EmailOTP(models.Model):
    email = models.EmailField(unique=True)
    otp_code = models.CharField(max_length=6)
    registration_data = models.JSONField()
    attempts = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        # 4 minutes expiry
        return (timezone.now() - self.created_at).total_seconds() > 240

    def __str__(self):
        return f"OTP for {self.email}"

class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    profile_photo = models.ImageField(upload_to='profiles/customers/', blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    address_text = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Customer Profile"

class WorkerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='worker_profile')
    profile_photo = models.ImageField(upload_to='profiles/workers/', blank=True, null=True)
    business_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    skills = models.JSONField(default=list, blank=True)
    rating = models.FloatField(default=0.0)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    address_text = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Worker Profile"

class BlockedUser(models.Model):
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('worker', 'Worker')
    ]
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocking')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blocker', 'blocked', 'role')

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username} as {self.role}"
