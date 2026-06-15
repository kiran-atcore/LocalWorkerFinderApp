from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomerProfile

admin.site.register(CustomerProfile)
