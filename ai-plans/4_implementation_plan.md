# Booking Feature Implementation Plan

## Overview
This plan implements the complete booking flow from booking initiation by the customer to completion by both parties.

## Components

### 1. Backend: Bookings App
- **models.py**: Create `Booking` model connecting `CustomerProfile`, `WorkerProfile`, and `JobRole`. Include fields for description, price, date, time, status, and completion booleans.
- **serializers.py**: Create `BookingSerializer` with read-only nested details for worker, customer, and job role to ease frontend rendering.
- **views.py**: Create `BookingViewSet` with endpoints for creating and viewing bookings. Add custom actions:
  - `POST /api/bookings/<id>/accept/` (Worker)
  - `POST /api/bookings/<id>/reject/` (Worker)
  - `POST /api/bookings/<id>/cancel/` (Customer)
  - `POST /api/bookings/<id>/complete/` (Both)
- **urls.py**: Register `BookingViewSet`.
- **config/settings**: Ensure `bookings` app is in `INSTALLED_APPS`. (Wait, it already exists, need to verify).
- **migrations**: Run `makemigrations bookings` and `migrate`.

### 2. Frontend: Booking Flow
- **ServiceView / JobRoleView**: Add "Book Service" button. Hide it if the `worker.user.id` matches the current logged-in user.
- **BookingForm/[id].tsx**: New screen for the customer to fill out the problem description, preferred price, date, and time. Submits POST to `/api/bookings/`.

### 3. Frontend: Activity Tabs
- **activity.tsx**: 
  - Update `CustomerActivityScreen` to fetch bookings for customer (Active: PENDING, ACCEPTED; Past: REJECTED, CANCELLED, COMPLETED).
  - Update `WorkerActivityScreen` to fetch bookings for worker (Active: PENDING, ACCEPTED; Past: REJECTED, COMPLETED). Exclude cancelled bookings from worker view completely.
- **BookingDetailsView/[id].tsx**: New screen showing full booking details. Provides action buttons depending on role and current status.
  - PENDING -> Customer can Cancel. Worker can Accept or Reject.
  - ACCEPTED -> Both can mark as Completed.
  - When marked as completed, calls `/api/bookings/<id>/complete/`. If both have called it, backend changes status to COMPLETED.

## Verification
- Test booking creation as a customer.
- Check worker activity tab for the incoming request.
- Accept booking, check status change.
- Mark completed from both ends, verify it moves to past tabs.
