# Migrate Radar Map to Free Alternative (Leaflet)

You are absolutely right! Since we already have a robust, 100% free mapping solution using Leaflet and `react-native-webview` in your `LocationSetUp` screen, we can use that exact same architecture for the Radar Map. 

This completely removes the dependency on Google Maps, bypasses all the API key issues, and ensures the map works instantly without needing to rebuild the native app every time.

## Proposed Changes

### 1. Remove `react-native-maps`
- We will uninstall `react-native-maps` as it is no longer needed and causes build friction.
- We will remove the dummy API key from `app.json`.

### 2. Rewrite `RadarMapPage` (`frontend/src/app/RadarMap/[id].tsx`)
- We will replace the native `<MapView>` with a `<WebView>` component.
- **Leaflet HTML Injection:** We will generate an HTML string containing the Leaflet map (OpenStreetMap tiles) and inject it into the WebView, exactly like `LocationSetUp`.
- **Plotting Pins:** Instead of a single draggable pin, we will loop through the fetched API data (`items`) and inject multiple `L.marker` objects into the Leaflet script.
- **Callouts & Navigation:** We will attach click event listeners to these Leaflet markers. When a marker is tapped, Leaflet will send a message via `window.ReactNativeWebView.postMessage` to React Native, which will then trigger the router to navigate to the `JobVacancyView` or display worker info!

## User Review Required
> [!NOTE]
> This is an incredibly smart pivot! Using Leaflet via WebView gives you a premium, interactive map experience completely free of cost and without native SDK headaches.
> 
> Please review this plan. If you approve, I will proceed with ripping out Google Maps and implementing Leaflet!

## Verification Plan
### Automated Tests
- Run `tsc` to verify no TypeScript regressions.

### Manual Verification
- Open the Radar Map on the emulator.
- Ensure the map loads OpenStreetMap tiles correctly (no API key errors).
- Ensure multiple pins are plotted for workers/jobs.
- Tap a pin to ensure it routes correctly to the details page.
