# Real-time Chat Implementation Plan

The goal is to implement a fully functional real-time chat feature, replacing the dummy UI with actual backend integration, supporting user blocking, search, and message/conversation deletion.

## User Review Required

> [!IMPORTANT]
> **Real-time implementation approach:**
> By default, "real-time" chat in Django requires setting up `channels` (WebSockets) and an ASGI server. For simplicity and to avoid requiring you to install Redis locally on Windows, I propose using **Short Polling** (the frontend automatically fetches new messages every few seconds while in the chat screen) or **In-Memory Django Channels**. 
> *I will proceed with the **Polling approach via standard REST API** as it requires the fewest environmental changes, unless you explicitly request WebSockets.*

## Proposed Changes

### 1. Backend (`core` app & `users` app)
#### [MODIFY] `backend/core/models.py`
- Add `Conversation` model (tracks participants).
- Add `Message` model (tracks conversation, sender, text, `is_read`, `created_at`, `is_deleted`).

#### [MODIFY] `backend/users/models.py`
- Add `Block` model to track which user blocked whom (blocker, blocked).

#### [NEW] `backend/core/serializers.py` & `backend/core/views.py`
- Create serializers and viewsets for `Conversation`, `Message`, and `Block`.
- Endpoints needed:
  - `GET /api/core/conversations/` (list user's conversations, with search filter)
  - `POST /api/core/conversations/` (start or get existing conversation)
  - `DELETE /api/core/conversations/{id}/` (clear/delete chat)
  - `GET /api/core/conversations/{id}/messages/` (list messages)
  - `POST /api/core/conversations/{id}/messages/` (send message)
  - `DELETE /api/core/messages/{id}/` (delete single message)
  - `POST /api/users/block/` (block a user)

#### [MODIFY] `backend/core/urls.py`
- Register the new viewsets with the router.

### 2. Frontend Chat Screens
#### [MODIFY] `frontend/src/app/(tabs)/chat.tsx`
- Integrate with `GET /api/core/conversations/`.
- **Search Bar:** Add a `TextInput` at the top to filter conversations by user name or last message text.
- **Unread Highlighting:** Make the chat name/message bold and highlighted if there are unread messages.
- **Delete Chat:** Wrap `chatItem` in a `LongPress` gesture or use `Alert` on long press to call the delete conversation API.

#### [MODIFY] `frontend/src/app/ChatInbox/[id].tsx`
- Integrate with `GET` and `POST` messages APIs.
- Set up a `setInterval` hook to poll for new messages every 3 seconds to simulate real-time behavior.
- **Block User:** Add an options icon (e.g., three dots) in the header with a "Block User" action.
- **Clear Chat:** Add a "Clear Chat" action in the header to delete the entire conversation.
- **Delete Single Message:** Add an `onLongPress` event to message bubbles to delete them.

### 3. Frontend Profile & Job Views
#### [MODIFY] `frontend/src/app/WorkerProfileView/[id].tsx`
- Add a "Chat" button. Pressing it will call `POST /api/core/conversations/` with the worker's user ID and navigate to `ChatInbox`.

#### [MODIFY] `frontend/src/app/JobVacancyView/[id].tsx`
- For Worker mode: Only display a "Chat with Client" button if the worker has an application for this vacancy and the `application.status === 'accepted'`.

## Verification Plan
### Automated Tests
- Run `python manage.py makemigrations` and `migrate` to ensure models are valid.
### Manual Verification
- Test sending messages between two accounts.
- Verify polling fetches new messages instantly.
- Test blocking a user prevents sending/receiving new messages.
- Test deleting a message and deleting a chat conversation.
- Verify search bar filters correctly.
