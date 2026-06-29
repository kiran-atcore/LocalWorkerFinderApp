from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Conversation, Message
from users.models import BlockedUser
from django.contrib.auth.models import User
from .serializers import ConversationSerializer, MessageSerializer, BlockedUserSerializer

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['role'] = self.request.query_params.get('role', 'customer')
        # Also handle POST requests where role is in data
        if self.request.method in ['POST', 'PUT', 'PATCH']:
            context['role'] = self.request.data.get('role', context['role'])
        return context

    def get_queryset(self):
        user = self.request.user
        role = self.request.query_params.get('role', 'customer')
        
        if role == 'worker':
            queryset = Conversation.objects.filter(worker=user, worker_deleted=False)
        else:
            queryset = Conversation.objects.filter(customer=user, customer_deleted=False)
            
        return queryset.order_by('-updated_at')

    @action(detail=False, methods=['get'])
    def find(self, request):
        other_user_id = request.query_params.get('other_user_id')
        role = request.query_params.get('role', 'customer')
        
        if not other_user_id:
            return Response({'error': 'other_user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if role == 'worker':
            conversation = Conversation.objects.filter(worker=request.user, customer=other_user).first()
        else:
            conversation = Conversation.objects.filter(customer=request.user, worker=other_user).first()
            
        if conversation:
            return Response({'id': conversation.id})
        return Response({'id': None})

    def create(self, request, *args, **kwargs):
        other_user_id = request.data.get('user_id')
        role = request.data.get('role', 'customer')
        
        if not other_user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if BlockedUser.objects.filter(blocker=request.user, blocked=other_user).exists() or \
           BlockedUser.objects.filter(blocker=other_user, blocked=request.user).exists():
            return Response({'error': 'Cannot create conversation due to block'}, status=status.HTTP_403_FORBIDDEN)

        if role == 'worker':
            conversation = Conversation.objects.filter(worker=request.user, customer=other_user).first()
            if not conversation:
                conversation = Conversation.objects.create(worker=request.user, customer=other_user)
        else:
            conversation = Conversation.objects.filter(customer=request.user, worker=other_user).first()
            if not conversation:
                conversation = Conversation.objects.create(customer=request.user, worker=other_user)
        
        # When creating or fetching via creation, make sure it's not deleted for the user
        if role == 'worker':
            conversation.worker_deleted = False
        else:
            conversation.customer_deleted = False
        conversation.save()

        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        # Delete Chat logic (from chat list)
        conversation = self.get_object()
        role = self.request.query_params.get('role', 'customer')
        
        if role == 'worker' and conversation.worker_id == request.user.id:
            conversation.worker_cleared_at = timezone.now()
            conversation.worker_deleted = True
            conversation.save()
        elif role == 'customer' and conversation.customer_id == request.user.id:
            conversation.customer_cleared_at = timezone.now()
            conversation.customer_deleted = True
            conversation.save()
            
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def clear(self, request, pk=None):
        # Clear chat logic (from inbox) - keeps conversation in list
        conversation = self.get_object()
        role = self.request.query_params.get('role', 'customer')
        
        if role == 'worker' and conversation.worker_id == request.user.id:
            conversation.worker_cleared_at = timezone.now()
            conversation.save()
        elif role == 'customer' and conversation.customer_id == request.user.id:
            conversation.customer_cleared_at = timezone.now()
            conversation.save()
            
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        user = request.user
        role = request.query_params.get('role', 'customer')
        
        count = 0
        if role == 'worker':
            conversations = Conversation.objects.filter(worker=user, worker_deleted=False)
            for conv in conversations:
                msgs = conv.messages.exclude(is_deleted_by_sender=True).exclude(worker_cleared=True).exclude(sender=user).filter(is_read=False)
                if conv.worker_cleared_at:
                    msgs = msgs.filter(created_at__gt=conv.worker_cleared_at)
                if msgs.exists():
                    count += 1
        else:
            conversations = Conversation.objects.filter(customer=user, customer_deleted=False)
            for conv in conversations:
                msgs = conv.messages.exclude(is_deleted_by_sender=True).exclude(customer_cleared=True).exclude(sender=user).filter(is_read=False)
                if conv.customer_cleared_at:
                    msgs = msgs.filter(created_at__gt=conv.customer_cleared_at)
                if msgs.exists():
                    count += 1
                    
        return Response({'unread_count': count})


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        conversation_id = self.request.query_params.get('conversation_id')
        role = self.request.query_params.get('role', 'customer')
        
        queryset = Message.objects.filter(Q(conversation__customer=user) | Q(conversation__worker=user))
        
        if role == 'worker':
            queryset = queryset.exclude(worker_cleared=True)
        else:
            queryset = queryset.exclude(customer_cleared=True)
        
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)
            
            # Filter by cleared timestamp
            try:
                conv = Conversation.objects.get(id=conversation_id)
                if role == 'worker' and conv.worker_id == user.id and conv.worker_cleared_at:
                    queryset = queryset.filter(created_at__gt=conv.worker_cleared_at)
                elif role == 'customer' and conv.customer_id == user.id and conv.customer_cleared_at:
                    queryset = queryset.filter(created_at__gt=conv.customer_cleared_at)
                    
                # Mark unread messages as read
                unread_messages = queryset.exclude(sender=user).filter(is_read=False)
                unread_messages.update(is_read=True)
            except Conversation.DoesNotExist:
                pass
            
        queryset = queryset.exclude(is_deleted_by_sender=True)
        return queryset.order_by('created_at')

    def create(self, request, *args, **kwargs):
        conversation_id = request.data.get('conversation_id')
        text = request.data.get('text')
        
        if not conversation_id or not text:
            return Response({'error': 'conversation_id and text are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            conversation = Conversation.objects.get(Q(id=conversation_id) & (Q(customer=request.user) | Q(worker=request.user)))
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

        other_user = conversation.customer if conversation.worker == request.user else conversation.worker
        if other_user and (BlockedUser.objects.filter(blocker=request.user, blocked=other_user).exists() or \
           BlockedUser.objects.filter(blocker=other_user, blocked=request.user).exists()):
            return Response({'error': 'Cannot send message due to block'}, status=status.HTTP_403_FORBIDDEN)

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            text=text
        )
        conversation.updated_at = message.created_at
        conversation.customer_deleted = False
        conversation.worker_deleted = False
        conversation.save()

        # Send push notification
        from core.notifications import send_push_notification
        sender_name = request.user.first_name or request.user.username
        send_push_notification(
            user=other_user,
            title=f"New message from {sender_name}",
            body=text[:100] + ("..." if len(text) > 100 else ""),
            data={"type": "chat", "conversation_id": conversation.id}
        )

        serializer = self.get_serializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.sender != request.user:
            return Response({'error': 'You can only unsend your own messages'}, status=status.HTTP_403_FORBIDDEN)
            
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def clear(self, request, pk=None):
        instance = self.get_object()
        role = request.query_params.get('role', 'customer')
        
        if role == 'worker' and instance.conversation.worker_id == request.user.id:
            instance.worker_cleared = True
            instance.save()
        elif role == 'customer' and instance.conversation.customer_id == request.user.id:
            instance.customer_cleared = True
            instance.save()
            
        return Response(status=status.HTTP_204_NO_CONTENT)

class BlockedUserViewSet(viewsets.ModelViewSet):
    serializer_class = BlockedUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        role = self.request.query_params.get('role', 'customer')
        return BlockedUser.objects.filter(blocker=self.request.user, role=role)

    @action(detail=False, methods=['post'])
    def unblock(self, request):
        blocked_id = request.data.get('blocked_id')
        role = request.data.get('role', 'customer')
        BlockedUser.objects.filter(blocker=request.user, blocked_id=blocked_id, role=role).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def check(self, request):
        other_user_id = request.query_params.get('other_user_id')
        role = request.query_params.get('role', 'customer')
        if not other_user_id:
            return Response({'error': 'other_user_id required'}, status=status.HTTP_400_BAD_REQUEST)
            
        is_blocked_by_me = BlockedUser.objects.filter(blocker=request.user, blocked_id=other_user_id, role=role).exists()
        is_blocked_by_other = BlockedUser.objects.filter(blocker_id=other_user_id, blocked=request.user, role=role).exists()
        
        return Response({
            'is_blocked_by_me': is_blocked_by_me,
            'is_blocked_by_other': is_blocked_by_other
        })

from .nlp import parse_nl_query
from rest_framework.views import APIView
from rest_framework import permissions

class ParseQueryView(APIView):
    """
    API View to parse natural language search queries and return structured filters.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        query = request.query_params.get('q', '')
        parsed_data = parse_nl_query(query)
        return Response(parsed_data)
