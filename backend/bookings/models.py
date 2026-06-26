from django.db import models
from users.models import CustomerProfile, WorkerProfile
from services.models import JobRole

class Booking(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('ACTIVE', 'Active'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
    ]

    customer = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name='bookings')
    worker = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name='bookings')
    job_role = models.ForeignKey(JobRole, on_delete=models.CASCADE, related_name='bookings')
    
    problem_description = models.TextField()
    negotiated_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    preferred_date = models.DateField(null=True, blank=True)
    preferred_time = models.TimeField(null=True, blank=True)
    
    # Location for the service request
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    address_text = models.CharField(max_length=255, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    worker_confirmed = models.BooleanField(default=False)
    customer_confirmed = models.BooleanField(default=False)
    
    customer_completed = models.BooleanField(default=False)
    worker_completed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Booking #{self.id} - {self.customer.user.username} to {self.worker.user.username}"

class JobVacancy(models.Model):
    customer = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name='job_vacancies')
    title = models.CharField(max_length=255, default='Untitled Job')
    category = models.CharField(max_length=100)
    skills_required = models.JSONField(default=list)
    experience_required = models.CharField(max_length=50)
    remuneration = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    address_text = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    contact_email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Vacancy: {self.category} by {self.customer.user.username}"

class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
    ]

    vacancy = models.ForeignKey(JobVacancy, on_delete=models.CASCADE, related_name='applications')
    worker = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name='applications')
    comment = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('vacancy', 'worker')

    def __str__(self):
        return f"Application by {self.worker.user.username} for {self.vacancy.id}"
