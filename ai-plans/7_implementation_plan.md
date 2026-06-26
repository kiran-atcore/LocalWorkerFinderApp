# Implementation Plan: Customer Job Vacancy & Worker Job Application Feature

## Overview
This feature allows Customers to post job vacancies to broadcast to local workers, and Workers to view and apply to these vacancies based on location proximity.

## 1. Backend Modifications (Django `bookings` app)

### Models
- **`JobVacancy`**:
  - `customer` (FK to `CustomerProfile`)
  - `category` (CharField)
  - `skills_required` (JSONField)
  - `experience_required` (CharField)
  - `remuneration` (DecimalField)
  - `description` (TextField)
  - `latitude`, `longitude`, `address_text` (copied from the customer's current location via `LocationBanner`)
  - `is_active` (BooleanField)
  - `created_at`, `updated_at`
- **`JobApplication`**:
  - `vacancy` (FK to `JobVacancy`)
  - `worker` (FK to `WorkerProfile`)
  - `comment` (TextField)
  - `status` (Choices: PENDING, ACCEPTED, REJECTED)
  - `created_at`, `updated_at`

### Serializers
- `JobVacancySerializer`: Includes nested Customer info and an `applications` count/list (for the customer).
- `JobApplicationSerializer`: Includes nested Worker profile info.

### Views & URLs
- `JobVacancyViewSet`:
  - `list`: For workers, returns open vacancies ordered by proximity to the worker's search radius.
  - `my_vacancies` (Custom action): For customers, returns their posted jobs.
  - `create`: For customers to post a new job.
  - `apply` (Custom action on vacancy detail): For workers to submit an application.
- `JobApplicationViewSet`:
  - `update`/`partial_update`: For customers to ACCEPT or REJECT an application.

---

## 2. Frontend Modifications (React Native / Expo)

### Customer View (`CustomerHomeScreen`)
- Insert a "Post a Job" button between the `Categories` and `Featured Workers` sections.
- **Routing**: `router.push('/JobVacancy/list')`.

### Customer Screens
1. **`JobVacancy/[id].tsx` (JobVacancyDetail)**:
   - Treated as the "My Posted Jobs" list if `id` is "list".
   - Displays a list of jobs posted by the customer.
   - Contains a floating or fixed bottom button: "Post Job", which routes to `/JobVacancyForm/new`.
   - Pressing a specific job routes to `/JobVacancyView/${job.id}`.
2. **`JobVacancyForm/[id].tsx` (JobVacancyFormDetail)**:
   - A form containing fields: Category (Dropdown/Picker), Skills (Multi-select), Experience, Remuneration, Description, and an embedded `LocationBanner` component to confirm location.
   - On submit, POSTs to the backend and routes back to `/JobVacancy/list`.
3. **`JobVacancyView/[id].tsx` (JobVacancyViewDetail)**:
   - Fetches vacancy details + list of `JobApplication`s.
   - Displays Applicant Worker details + comment.
   - Actions to ACCEPT or REJECT.
   - Actions to view the Worker's Profile (`/WorkerProfileView/${worker.id}`).

### Worker View (`WorkerHomeScreen`)
- Replace the dummy static data in the "Latest Job Requests" section of `home.tsx` with dynamic API fetching from the `JobVacancyViewSet` list endpoint.
- Incorporate a Radius Slider filter identical to the Customer's home tab to filter nearby vacancies.
- Pressing a job card routes to `/JobVacancyView/${job.id}`.

### Worker Screens
1. **`JobVacancyView/[id].tsx` (JobVacancyViewDetail)**:
   - Reused screen, but detects `activeRole === 'worker'`.
   - In worker mode, hides the applicants list.
   - Displays an "Apply" button and a text input for a comment/cover letter.
   - Upon applying, updates the UI to show "Application Submitted".

## User Review Required
> [!IMPORTANT]
> Since this task was initiated with `/goal`, I will proceed autonomously with this execution plan immediately without waiting for manual approval. I will build the backend, run migrations, and implement the frontend screens step-by-step.
