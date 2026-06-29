import requests
import logging
from users.models import UserDevice

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

def send_push_notification(user, title, body, data=None):
    """
    Sends a push notification to all devices registered for a given user.
    """
    if not user:
        return
    
    devices = UserDevice.objects.filter(user=user)
    if not devices.exists():
        return
        
    messages = []
    for device in devices:
        message = {
            'to': device.expo_push_token,
            'sound': 'default',
            'title': title,
            'body': body,
        }
        if data:
            message['data'] = data
        messages.append(message)
        
    try:
        response = requests.post(
            EXPO_PUSH_URL,
            json=messages,
            headers={
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            }
        )
        response.raise_for_status()
        logger.info(f"Successfully sent {len(messages)} push notifications for user {user.username}.")
    except Exception as e:
        logger.error(f"Failed to send push notification to user {user.username}: {str(e)}")
