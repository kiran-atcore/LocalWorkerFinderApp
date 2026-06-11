Here is the comprehensive architectural blueprint, folder structure, and page breakdown for a local worker finder application using your specified technology stack.

Architecture & Technology Strategy
----------------------------------

*   **Frontend Environment:** React Native with Expo Router (file-based routing).
    
*   **Build System:** Expo Development Build using EAS CLI (expo-dev-client). This allows the injection of custom native code (Android/Java/Kotlin) while maintaining the fast refresh of Expo.
    
*   **State & Data Handling:** React Hook Form bound with Yup resolvers for highly performant, re-render-free validation.
    
*   **Backend Framework:** Django with Django REST Framework (DRF).
    
*   **Authentication:** Session Authentication. Since React Native does not have a native browser environment to handle cookies automatically, a native library (like @preeternal/react-native-cookie-manager) will be used within the development build to extract and attach the sessionid and csrftoken to API requests.
    

App Flow & Page Descriptions
----------------------------

**Route / ScreenTarget UserDescription**Welcome (/)BothSplash screen transitioning to role selection (Client or Worker).Auth (/(auth)/login)BothLogin and Registration forms. Uses react-hook-form and yup to validate email formats, password strength, and phone numbers before hitting the Django API.Home (/(tabs)/home)ClientSearch bar with geolocation support. Grid view of service categories (Plumbing, Electrical, Carpentry).Worker List (/workers/\[category\])ClientList of available workers filtered by category, proximity, and rating.Worker Profile (/worker/\[id\])ClientDetailed view of a specific worker, displaying their bio, hourly rate, photo gallery (portfolio), and client reviews.Booking Form (/book/\[id\])ClientForm to request a service. Collects date, time, address, and a description of the issue. Validated by yup.Jobs Dashboard (/(tabs)/jobs)WorkerTabbed view of incoming job requests, active jobs, and completed history. Allows workers to accept/decline bookings.Client Bookings (/(tabs)/bookings)ClientList of pending, upcoming, and past service requests with real-time status updates.Profile & Settings (/(tabs)/profile)BothAccount management. Workers can update their trade categories and availability; Clients can update their saved addresses.

Frontend Folder Structure (Expo + React Native)
-----------------------------------------------

This structure separates routing logic from UI components and utilizes the app/ directory mandated by modern Expo Router conventions.

*   app/: Contains all file-based routing screens (e.g., \_layout.tsx, (auth)/login.tsx, (tabs)/home.tsx).
    
*   src/components/: Reusable UI elements like PrimaryButton.tsx, WorkerCard.tsx, and FormInput.tsx.
    
*   src/schemas/: Centralized Yup validation schemas (e.g., loginSchema.ts, bookingSchema.ts) to keep component files clean.
    
*   src/services/: API logic. This includes the Axios instance configured with withCredentials: true and interceptors to attach CSRF tokens to POST requests.
    
*   src/hooks/: Custom React hooks, such as useAuth.ts for managing session state or wrappers for geolocation.
    
*   assets/: Static media, app icons, splash screens, and custom fonts.
    
*   app.json: Expo manifest for declaring Android permissions (e.g., ACCESS\_FINE\_LOCATION) and configuring Expo plugins.
    
*   eas.json: Build configuration file for Expo Application Services to generate the Android development build (.apk or .aab).
    
*   package.json: Project dependencies, including @preeternal/react-native-cookie-manager, react-hook-form, yup, and @hookform/resolvers.
    

Backend Folder Structure (Django)
---------------------------------

The backend is modularized into dedicated Django apps to separate concerns between user management, service categorization, and the booking lifecycle.

*   core/: The main project configuration directory containing settings.py (configured for session auth and CORS) and the root urls.py.
    
*   users/: App managing a custom User model, role assignments (Client vs. Worker), profiles, and the session login/logout API views.
    
*   services/: App containing models for Category (e.g., Electrician), WorkerProfile (linking a user to categories, rates, and location), and PortfolioImage.
    
*   bookings/: App managing the JobRequest model, tracking statuses (Pending, Accepted, In Progress, Completed), and storing reviews/ratings.
    
*   manage.py: The Django command-line utility.
    
*   requirements.txt: Python dependencies including django, djangorestframework, django-cors-headers, and Pillow (for image processing).
    

Critical Implementation Notes
-----------------------------

### 1\. Handling Session Auth on React Native

Unlike a web browser, React Native does not automatically send cookies back to the server. You must configure your Django backend to allow credentials from your app's origin and configure your frontend API client accordingly.

You will need a native library to read the csrftoken generated by Django. In your API utility file, configure Axios to include these credentials:

JavaScript

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   import axios from 'axios';  import CookieManager from '@preeternal/react-native-cookie-manager';  const apiClient = axios.create({    baseURL: 'https://your-django-backend.com/api',    withCredentials: true, // Crucial for session authentication  });  // Intercept requests to attach the CSRF token  apiClient.interceptors.request.use(async (config) => {    if (config.method !== 'get') {      const cookies = await CookieManager.get('https://your-django-backend.com');      if (cookies.csrftoken) {        config.headers['X-CSRFToken'] = cookies.csrftoken.value;      }    }    return config;  });   `

### 2\. Utilizing the Development Build

Because standard "Expo Go" does not support native libraries like @preeternal/react-native-cookie-manager or advanced background geolocation tools, you will generate a custom development client.

Run npx expo run:android to compile the local Android directory, or use eas build --profile development --platform android to build it in the cloud. This provides an app shell on your emulator or physical device that natively understands the custom libraries while still allowing you to hot-reload your JavaScript and TypeScript code.