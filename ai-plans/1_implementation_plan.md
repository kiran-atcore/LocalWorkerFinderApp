# Dual-Role Architecture Implementation Plan

This plan outlines the steps to implement the "Customer / Worker" dual-role architecture, including the backend models for the worker, the API endpoints for switching roles and deleting accounts, and the frontend static tab structures.

## User Review Required

> [!WARNING]
> Please review the role-switching flow. I plan to add an `active_role` field to the frontend's Zustand store (`customer` or `worker`). When the user presses "Switch to Worker Mode", the app will call an endpoint `/api/users/switch-role/`. If the user does not have a `WorkerProfile`, the backend will automatically create an empty one and confirm the switch. Does this approach align with your expectations?

## Proposed Changes

### Backend Component

#### [MODIFY] `backend/users/models.py`
- Add a `WorkerProfile` model with a One-to-One relationship to `User`.
- Fields: `business_name` (optional), `rating` (default 0.0), `total_earnings` (default 0.0).

#### [MODIFY] `backend/users/serializers.py`
- Create `WorkerProfileSerializer`.
- Update `UserSerializer` to include a boolean flag `has_worker_profile` to help the frontend determine if setup is needed.

#### [MODIFY] `backend/users/views.py`
- **Role Switching**: Create `SwitchRoleView` (POST). It will check if `WorkerProfile` exists for the user. If not, it creates a default one. It returns a success message confirming the switch.
- **Account Deletion**: Create `DeleteAccountView` (DELETE). It will permanently delete the `request.user` and their associated profiles.

#### [MODIFY] `backend/users/urls.py`
- Add paths for `/switch-role/` and `/delete-account/`.

---

### Frontend Component

#### [MODIFY] `frontend/src/store/useAuthStore.ts`
- Add an `activeRole` state property (defaulting to `'customer'`).
- Add an action `setActiveRole(role: 'customer' | 'worker')` to toggle the UI.

#### [MODIFY] `frontend/src/app/(tabs)/home.tsx`
- Refactor to conditionally render `CustomerHomeScreen` or `WorkerHomeScreen` based on `activeRole`.
- Add dummy UI for location banner, search bar, and categories per `base-architecture.md`.

#### [NEW] `frontend/src/app/(tabs)/activity.tsx`
- Create static UI. Conditionally render `CustomerActivityScreen` (Pending/Active/Past) or `WorkerActivityScreen` (Incoming/Active/Past) based on `activeRole`.

#### [NEW] `frontend/src/app/(tabs)/profile.tsx`
- Create static UI. Conditionally render `CustomerProfileScreen` or `WorkerProfileScreen`.
- Implement `handleLogout`, `handleDeleteAccount` (with confirmation alert), and `handleRoleSwitch`.

## Verification Plan

### Automated/Manual Verification
- Run backend migrations to apply the `WorkerProfile` model.
- Test the "Switch to Worker Mode" button to ensure it properly communicates with the backend, initializes the `WorkerProfile`, and updates the global frontend state.
- Verify the tabs update dynamically based on the current active role without needing a full page reload.
- Test the "Delete Account" button to ensure it clears the session, deletes the backend record, and routes the user back to the login screen.
