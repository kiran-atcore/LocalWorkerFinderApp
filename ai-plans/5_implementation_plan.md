# Distance Filtering & Booking Location Features

This plan outlines the steps to implement the UI and backend changes requested: displaying distances on Worker Cards, adding the radius slider to the Category List, and adding location support to Bookings.

## Proposed Changes

### 1. Distance Calculation & WorkerCard Updates
- **`WorkerCard.tsx`**
  - [MODIFY] Add an optional `distance?: number` prop to the `WorkerCardProps`.
  - [MODIFY] Update the UI to render the distance (e.g., `5.2 km away`) in the header next to the worker's name or rating.
- **`home.tsx`**
  - [MODIFY] Currently, `home.tsx` calculates distance but doesn't pass it to the card. Update `filteredWorkers.map` to pass the calculated distance down to `<WorkerCard distance={dist} />`.

### 2. CategoryList Distance Filtering
- **`CategoryList/[id].tsx`**
  - [MODIFY] Extract or duplicate the exact same `Slider`, `Switch`, and Haversine formula logic from `home.tsx` into the `CategoryList` screen.
  - [MODIFY] Filter the fetched workers by distance and pass the computed `distance` prop to the `<WorkerCard>` components rendered here.

### 3. Booking Backend Updates
- **`backend/bookings/models.py`**
  - [MODIFY] Add `latitude`, `longitude`, and `address_text` fields to the `Booking` model to store the specific location for a service request.
- **`backend/bookings/serializers.py`**
  - [MODIFY] Add the new location fields to the serializers so the API accepts and returns them.
- **Terminal**
  - Run `python manage.py makemigrations` and `python manage.py migrate` to update the database schema.

### 4. Booking Frontend Updates
- **`BookingForm/[id].tsx`**
  - [MODIFY] Embed `<LocationBanner />` in the form.
  - [MODIFY] When submitting the form (`handleSubmit`), attach the current `searchLocation` (from `useAuthStore`) to the booking POST payload.
- **`BookingDetailsView/[id].tsx`**
  - [MODIFY] Fetch and display the booking's `address_text` in the details view.
  - [MODIFY] Optionally embed a read-only Leaflet `WebView` minimap (like the one in WorkerProfileView) to show the worker exactly where the job is.

## User Review Required
> [!IMPORTANT]
> The backend `Booking` model requires a database schema change. I will run the migrations automatically. Also, I will use `LocationBanner` in the `BookingForm`. Since `LocationBanner` automatically uses your "global search location" state, modifying the location in the booking form will intuitively also update your app's general search location. 
> Please review and approve to proceed!
