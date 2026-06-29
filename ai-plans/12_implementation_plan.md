# Implement Ratings and Reviews System

This plan outlines the architecture and steps to implement the full Ratings and Reviews system for workers.

## User Review Required
Please review the plan below. I need your approval to proceed. The only open question is whether the "Edit" function should open the same `AddReviewForm` (pre-filled) or a separate screen. I plan to use `AddReviewForm` and pass an `editId` parameter to handle both creation and editing seamlessly.

## Proposed Changes

### Backend

#### [MODIFY] [users/models.py](file:///c:/dev/LocalWorkerFinderApp/backend/users/models.py)
- Create a `Review` model with fields:
  - `worker` (ForeignKey to `WorkerProfile`)
  - `customer` (ForeignKey to `CustomerProfile`)
  - Ratings (Integer 1-5): `skill_rating`, `performance_rating`, `service_quality_rating`, `friendly_rating`, `cost_efficiency_rating`
  - `overall_rating` (Float) - automatically calculated as the average
  - `review_text` (TextField)
  - `created_at` & `updated_at` (Timestamps)
- Add a `UniqueConstraint` on `worker` and `customer` to ensure a customer can only review a specific worker once.
- Add signal or `save` override to automatically update the `WorkerProfile.rating` field whenever a review is created, updated, or deleted.

#### [MODIFY] [users/serializers.py](file:///c:/dev/LocalWorkerFinderApp/backend/users/serializers.py)
- Create `ReviewSerializer` which includes nested customer details (for displaying the reviewer's name and photo).
- Create `WorkerReviewStatsSerializer` to handle aggregated rating statistics.

#### [MODIFY] [users/views.py](file:///c:/dev/LocalWorkerFinderApp/backend/users/views.py)
- Create `ReviewViewSet` for CRUD operations.
  - Automatically assign the logged-in customer when creating a review.
  - Recalculate `overall_rating` on save.
- Update `WorkerProfileDetailView` (or add a new endpoint) to return rating averages (skill, performance, etc.) and a boolean `has_reviewed` flag indicating if the current user has already left a review.

#### [MODIFY] [users/urls.py](file:///c:/dev/LocalWorkerFinderApp/backend/users/urls.py)
- Register routes for the new `ReviewViewSet` via DRF router.

---

### Frontend

#### [MODIFY] [WorkerProfileView/[id].tsx](file:///c:/dev/LocalWorkerFinderApp/frontend/src/app/WorkerProfileView/%5Bid%5D.tsx)
- Fetch and display the overall stats (Skill, Performance, Service Quality, Friendly, Cost Efficiency).
- Display the top 3 latest reviews.
- Render an "Add Review" button (only if the user is a customer and hasn't reviewed yet).
- Render a "View All Reviews" button routing to `ReviewList`.

#### [NEW] [AddReviewForm/[id].tsx](file:///c:/dev/LocalWorkerFinderApp/frontend/src/app/AddReviewForm/%5Bid%5D.tsx)
- A form with 5 distinct star rating inputs and a text area for the review.
- Submits the review to the backend. Will support an `edit=true` mode if an existing review is passed.

#### [NEW] [ReviewList/[id].tsx](file:///c:/dev/LocalWorkerFinderApp/frontend/src/app/ReviewList/%5Bid%5D.tsx)
- Fetches and displays all reviews for the worker using a `FlatList`.
- Shows the overall star rating and a snippet of the review text.
- Includes a button to view the full review in `ReviewView`.

#### [NEW] [ReviewView/[id].tsx](file:///c:/dev/LocalWorkerFinderApp/frontend/src/app/ReviewView/%5Bid%5D.tsx)
- Displays the full review, including all 5 sub-ratings and full text.
- If the logged-in user is the author of the review, "Edit" and "Delete" buttons will be visible.
- Editing will route back to `AddReviewForm`, and deleting will prompt a confirmation before hitting the API.

## Verification Plan

### Automated Tests
- Syntax check and model migrations:
  - `python manage.py makemigrations`
  - `python manage.py migrate`

### Manual Verification
- Log in as a customer, visit a worker profile. Verify the "Add Review" button appears.
- Submit a review, verify it computes the overall rating and updates the worker's average.
- Verify the button disappears after submitting (preventing duplicates).
- Verify the "View All Reviews" and individual "Review View" screens render properly.
- Verify the author can edit and delete their own review.
