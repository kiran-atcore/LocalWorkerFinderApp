from rest_framework import serializers
from .models import Conversation, Message
from django.contrib.auth.models import User
from users.models import BlockedUser

class UserMinimalSerializer(serializers.ModelSerializer):
    profile_photo = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile_photo', 'display_name']

    def get_profile_photo(self, obj):
        request = self.context.get('request')
        photo_url = None
        if hasattr(obj, 'customer_profile') and obj.customer_profile.profile_photo:
            photo_url = obj.customer_profile.profile_photo.url
        elif hasattr(obj, 'worker_profile') and obj.worker_profile.profile_photo:
            photo_url = obj.worker_profile.profile_photo.url
        
        if photo_url and request:
            return request.build_absolute_uri(photo_url)
        return photo_url

    def get_display_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        if not name:
            if hasattr(obj, 'worker_profile') and obj.worker_profile.business_name:
                return obj.worker_profile.business_name
            return obj.username
        return name

class MessageSerializer(serializers.ModelSerializer):
    sender = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'text', 'is_read', 'created_at', 'is_deleted_by_sender']
        read_only_fields = ['sender', 'is_read', 'created_at', 'is_deleted_by_sender']

class ConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'created_at', 'updated_at', 'last_message', 'unread_count', 'other_participant']

    def get_last_message(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        role = self.context.get('role', 'customer')
        
        # Determine the cutoff time for messages based on when the user cleared the chat
        cutoff = obj.worker_cleared_at if role == 'worker' else obj.customer_cleared_at

        # Fetch messages after cutoff, excluding unsent messages and cleared messages for this user
        msgs = obj.messages.exclude(is_deleted_by_sender=True)
        if role == 'worker':
            msgs = msgs.exclude(worker_cleared=True)
        else:
            msgs = msgs.exclude(customer_cleared=True)
            
        if cutoff:
            msgs = msgs.filter(created_at__gt=cutoff)

        last_msg = msgs.order_by('-created_at').first()
        if last_msg:
            return {
                'id': last_msg.id,
                'text': last_msg.text,
                'created_at': last_msg.created_at,
                'sender_id': last_msg.sender_id
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        role = self.context.get('role', 'customer')
        if request and request.user.is_authenticated:
            msgs = obj.messages.exclude(is_deleted_by_sender=True).exclude(sender=request.user).filter(is_read=False)
            if role == 'worker':
                msgs = msgs.exclude(worker_cleared=True)
            else:
                msgs = msgs.exclude(customer_cleared=True)
                
            cutoff = obj.worker_cleared_at if role == 'worker' else obj.customer_cleared_at
            if cutoff:
                msgs = msgs.filter(created_at__gt=cutoff)
            return msgs.count()
        return 0

    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other = obj.customer if obj.worker_id == request.user.id else obj.worker
            if other:
                return UserMinimalSerializer(other, context=self.context).data
        return None

class BlockedUserSerializer(serializers.ModelSerializer):
    blocked = UserMinimalSerializer(read_only=True)
    blocked_id = serializers.IntegerField(write_only=True)
    role = serializers.CharField(write_only=True, default='customer')

    class Meta:
        model = BlockedUser
        fields = ['id', 'blocked', 'blocked_id', 'role', 'created_at']

    def create(self, validated_data):
        blocker = self.context['request'].user
        blocked_id = validated_data.pop('blocked_id')
        role = validated_data.pop('role', 'customer')
        blocked_user = User.objects.get(id=blocked_id)
        block, created = BlockedUser.objects.get_or_create(blocker=blocker, blocked=blocked_user, role=role)
        return block
