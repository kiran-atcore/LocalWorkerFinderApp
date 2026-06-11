from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('Client', 'Client'),
        ('Worker', 'Worker'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='Client')
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"