from django.db import models
from django.contrib.auth.models import User

class Conversation(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_conversations', null=True)
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='worker_conversations', null=True)
    
    customer_cleared_at = models.DateTimeField(null=True, blank=True)
    worker_cleared_at = models.DateTimeField(null=True, blank=True)
    
    customer_deleted = models.BooleanField(default=False)
    worker_deleted = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation {self.id}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted_by_sender = models.BooleanField(default=False)
    customer_cleared = models.BooleanField(default=False)
    worker_cleared = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message {self.id} in {self.conversation}"