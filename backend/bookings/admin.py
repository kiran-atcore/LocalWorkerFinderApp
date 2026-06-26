from django.contrib import admin
from .models import Booking, JobApplication, JobVacancy

admin.site.register(Booking)
admin.site.register(JobApplication)
admin.site.register(JobVacancy)