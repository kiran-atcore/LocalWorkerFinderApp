# Authentication Flow Implementation Plan

This document outlines the proposed implementation plan for the authentication flow in the LocalWorkerFinderApp, integrating the React Native frontend and the Django backend using session-based authentication.

## User Review Required

> [!WARNING]
> Please review the dependencies list and architecture. I will be using React Context to handle global authentication state so the `index.tsx` file can route users to the correct stack. I'll also add a `CustomerProfile` model on the backend as outlined in the `base-architecture.md`.

## Proposed Changes

### Frontend Component

#### [NEW] `frontend/src/app/services/axios.ts`
- Create a global axios instance.
- Configure `baseURL` pointing to the Django backend.
- Ensure `withCredentials: true` is set to support Django session cookies.

#### [NEW] `frontend/src/app/(auth)/login.tsx`
- Implement login screen using `react-hook-form` and `@hookform/resolvers/yup`.
- Create a `loginSchema` with `yup`.
- On successful login, update the global auth state and redirect.

#### [NEW] `frontend/src/app/(auth)/register.tsx`
- Implement registration screen using `react-hook-form` and `@hookform/resolvers/yup`.
- Create a `registerSchema` with `yup` containing validations for `fullName`, `email`, `password`, `confirmPassword`.
- Submit to Django without role payload, letting backend assign "Customer" default profile.
- On success, update the global auth state and redirect.

#### [MODIFY] `frontend/src/app/index.tsx`
- Update to act as the root router / splash screen.
- Verify user authentication session and either redirect to `<AuthNavigator />` or `<MainTabNavigator />` accordingly.

---

### Backend Component

#### [MODIFY] `backend/users/models.py`
- Add `CustomerProfile` model connected to Django's built-in `User` model (using OneToOneField).
- Add signals or handle profile creation during user registration.

#### [MODIFY] `backend/users/serializers.py`
- Create `UserSerializer`, `RegisterSerializer`, and `LoginSerializer`.
- `RegisterSerializer` will validate user creation and handle creating the `User` and `CustomerProfile` automatically.

#### [MODIFY] `backend/users/views.py`
- Implement `RegisterView` (creates user, assigns `CustomerProfile`, and optionally logs them in).
- Implement `LoginView` (uses `authenticate` and `login` to create a session).
- Implement `LogoutView` (clears the session cookie).
- Implement `SessionCheckView` (returns current user info if session is valid, useful for frontend initialization).

#### [NEW] `backend/users/urls.py`
- Register endpoints: `register/`, `login/`, `logout/`, `session/`.

#### [MODIFY] `backend/core/urls.py`
- Include `users.urls` under `api/users/`.

#### [MODIFY] `backend/users/admin.py`
- Register the `CustomerProfile` with Django admin alongside `UserAdmin`.

#### [REVIEW] `backend/core/settings.py`
- Ensure `CORS_ALLOW_CREDENTIALS = True` is present.
- Verify `CSRF_TRUSTED_ORIGINS` includes Android emulator IPs (`10.0.2.2`).

## Verification Plan

### Automated/Manual Verification
- Run the Django server locally and ensure `api/users/register/` and `api/users/login/` endpoints work and return session cookies.
- Run the React Native Android development build and verify the login/register screens validation works dynamically.
- Check session persistence after closing and reopening the app.
