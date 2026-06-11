from django.db import models
from django.conf import settings
from services.models import WorkerProfile

class JobRequest(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Accepted', 'Accepted'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Declined', 'Declined')
    ]
    
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='requested_jobs')
    worker = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name='assigned_jobs')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    date = models.DateField()
    time = models.TimeField()
    address = models.TextField()
    description = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Job {self.id} - {self.client.username} to {self.worker.user.username} ({self.status})"