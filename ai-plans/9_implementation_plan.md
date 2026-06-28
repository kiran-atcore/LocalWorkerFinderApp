# Implement Interactive "Radar" Map View

This document outlines the plan to implement a geospatial search feature using `react-native-maps`. Since your backend and frontend already support fetching locations (latitude and longitude) for both workers and job vacancies, we can build this feature elegantly on the frontend without needing complex backend PostGIS migrations!

## Proposed Changes

### 1. Install Dependencies
We will install `react-native-maps` and `expo-location` (if not fully configured yet). Since Expo Go handles map views out of the box, this should work without a native prebuild.
- Command: `npx expo install react-native-maps`

### 2. Frontend Map Screen (`frontend/src/app/RadarMap/[id].tsx`)
We will transform the placeholder `RadarMapPage` into a full-screen interactive map.
- Based on the `id` param (e.g., `jobs` vs `workers`), the map will determine what to display.
- **Center Location:** The map will center on the user's current `searchLocation` from the global store, defaulting to their device location.
- **Markers:** 
  - For Customers (`/RadarMap/workers`): Fetches `/users/featured-workers/` and drops custom pins for available workers.
  - For Workers (`/RadarMap/jobs`): Fetches `/bookings/vacancies/` and drops custom pins for active job postings.
- **Interactions:** Tapping a marker will show a Callout (a small popup) summarizing the job/worker. Tapping the popup routes the user to the full details page (`/JobVacancyView/[id]` or the worker profile).

### 3. Update Home Screen (`frontend/src/app/(tabs)/home.tsx`)
We will add a prominent button to the Home Screen:
- **CustomerHomeScreen:** Add a button titled "📍 View Workers Nearby on Map" near the search/radius area.
- **WorkerHomeScreen:** Add a button titled "📍 View Jobs Nearby on Map" near the search/radius area.
- Tapping these buttons will route the user to `/RadarMap/workers` and `/RadarMap/jobs` respectively.

## User Review Required
> [!IMPORTANT]
> Because your project currently uses SQLite, adding true PostGIS backend support requires migrating to a full PostgreSQL database server with system-level spatial libraries installed (GDAL/GEOS). 
> 
> **My recommendation:** Since the frontend already retrieves the list of active jobs and workers with their latitudes and longitudes, we can plot them directly on the map and calculate distances instantly on the device! This requires **zero backend database changes** and is extremely fast for standard marketplace apps.
> 
> If you approve, I will proceed with this efficient frontend-focused approach!

## Verification Plan
### Automated Tests
- Run `tsc` to verify TypeScript types for the new map component.

### Manual Verification
- Verify the "Map" button appears on the Home Screen for both Customer and Worker roles.
- Verify clicking it navigates to the Radar Map.
- Verify the map centers correctly on the user's location.
- Verify pins appear accurately based on the existing backend coordinates.
- Verify tapping a pin opens the correct details screen.
