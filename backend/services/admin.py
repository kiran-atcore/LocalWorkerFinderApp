from django.contrib import admin
from .models import Category, WorkerProfile, PortfolioImage

admin.site.register(Category)
admin.site.register(WorkerProfile)
admin.site.register(PortfolioImage)