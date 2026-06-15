content = """# Profile Tab & Backend Data Models Specification

## Frontend: Profile Tab Updates

### 1. Customer Mode (`CustomerProfileScreen`)
* **Display Details:** Profile Photo, Full Name, Email ID.
* **Edit Profile Button:** * Routes to `CustomerProfileEdit/[id].tsx`.
  * **Functionality:** Upload a new profile photo, remove the current photo (revert to a blank/default avatar), and edit the Full Name.

### 2. Worker Mode (`WorkerProfileScreen`)
* **Display Details:** Profile Photo, Full Name, Email ID.
* **View Profile Button:** * Routes to `WorkerProfileView/[id].tsx`.
  * **Functionality:** Displays the entire public-facing worker profile (how customers see them).
* **Edit Profile Button:** * Routes to `WorkerProfileEdit/[id].tsx`.
  * **Functionality:** Upload/remove profile photo, edit Full Name, add/edit Bio, update Skills (implemented as a multi-select dropdown of predefined job roles), and edit other business details.

### 3. Shared UI (Sticky Bottom Section)
Both modes will feature a sticky bottom container holding the following actions to ensure they are always accessible without scrolling:
* **Switch User Button:** Toggles between Customer and Worker modes.
* **Logout Button:** Clears the session and routes to the Auth stack.
* **Delete Account Button:** High-friction action to permanently delete the user's data.

---

## Backend: Django Models (`users` app)

### 1. User Model (Customer/Base)
We will create a custom User model. Since "Customer" is the default role, the base `User` model will hold the core shared information.