from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomerProfile, WorkerProfile, BlockedUser

@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'address_text', 'created_at')
    search_fields = ('user__username', 'address_text')

@admin.register(WorkerProfile)
class WorkerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'business_name', 'rating', 'total_earnings', 'created_at')
    search_fields = ('user__username', 'business_name', 'address_text')
    list_filter = ('rating',)

@admin.register(BlockedUser)
class BlockedUserAdmin(admin.ModelAdmin):
    list_display = ('id', 'blocker', 'blocked', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('blocker__username', 'blocked__username')
    date_hierarchy = 'created_at'