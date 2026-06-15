# Goal Description

Replace the dummy data in the `CategoryList/[id].tsx` screen with actual job roles created by workers on the platform. The displayed list must correspond to the selected category. We also need to ensure that workers do not see their own job roles when browsing categories.

To achieve this, we need to create a new public search API endpoint on the backend and update the frontend to consume it.

## Proposed Changes

### Backend API (`backend/services` & `backend/users`)

#### [NEW] `backend/services/serializers.py` (Additions)
- Create a new `PublicJobRoleSerializer` that extends `JobRoleSerializer` to include read-only fields for the worker's details (e.g., first name, last name, rating, profile photo, and a mocked distance string since we don't have GPS coordinates yet).

#### [MODIFY] `backend/services/views.py`
- Create a `PublicJobRoleViewSet` (Read-Only).
- Override `get_queryset()` to:
  - Filter by `is_active=True`.
  - Filter by the `category` query parameter (e.g., `?category=plumbing`).
  - **Exclude** the current logged-in user's job roles to fulfill the requirement: "Avoid adding the job roles added by the user itself".
  - Use `select_related('worker', 'worker__user')` for query optimization.

#### [MODIFY] `backend/services/urls.py`
- Register `PublicJobRoleViewSet` under a new route, such as `/services/search/job-roles/`.

---

### Frontend (`frontend/src/app`)

#### [MODIFY] `frontend/src/app/CategoryList/[id].tsx`
- Remove the `DUMMY_WORKERS` constant completely.
- Add React state variables `jobRoles` and `isLoading`.
- Use `useEffect` to call `api.get('/services/search/job-roles/?category=${id}')` when the screen mounts.
- Update the `renderWorker` function to map the fields returned by the new `PublicJobRoleSerializer` (e.g., worker name, rating, profile photo, hourly rate).
- Ensure the `ListEmptyComponent` of the `FlatList` displays a clean fallback message if no job roles are found.

## Verification Plan

### Automated Tests
- TypeScript check (`npx tsc --noEmit`) to ensure the frontend types align.

### Manual Verification
1. Open the app as a **Customer**, click on a category (e.g., "Plumbing"), and verify that real plumbing job roles created by other workers are displayed.
2. Open the app as a **Worker**, create a job role under "Cleaning", then go to the Home tab and click "Cleaning". Verify that the job role you *just created* does **not** appear in your own list.
3. Click on an empty category and verify the fallback message is displayed.

> [!NOTE]
> Please approve this plan so I can begin making these backend and frontend changes!
