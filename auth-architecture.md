content = """# Authentication Flow: React Native & Django

Here is a detailed, structured breakdown of the authentication flow for your React Native and Django application, focusing on the integration of `react-hook-form`, `yup`, and session-based routing.

## 1. Libraries & Dependencies
To build this flow efficiently, you will need the following frontend packages:
* **`react-hook-form`**: Manages form state, input binding, and submission without causing unnecessary re-renders.
* **`yup`**: Provides a clean, schema-based approach to define validation rules.
* **`@hookform/resolvers/yup`**: The bridge library that allows `react-hook-form` to use your Yup schemas for validation.
* **`axios`**: To handle API requests to your Django backend. Crucially, it must be configured with `withCredentials: true` to send and receive Django's session cookies.
* **`@react-navigation/native` & `@react-navigation/native-stack`**: For routing the user to the dummy Home tab upon success.

## 2. Core Features
* **Session-Based Persistence:** Instead of manually storing and attaching JWTs, the app relies on Django's native session cookies. Once authenticated, the browser/React Native environment automatically includes the session cookie in subsequent requests.
* **Real-Time Validation:** Input fields validate dynamically (e.g., checking if passwords match or if the email format is correct) before the user even hits the submit button.
* **Default Role Assignment:** The frontend completely abstracts the role selection away from the user during registration. The API payload only sends user details, and the Django backend creates the `User` instance and automatically assigns the "Customer" profile.
* **Loading States:** Buttons disable automatically while the API request is pending to prevent duplicate submissions.

## 3. Yup Validation Schemas
Defining strict schemas ensures the backend only receives clean, expected data.

## 4. Screen Descriptions

### Login Screen
* **Fields:** * Email (`keyboardType="email-address"`, `autoCapitalize="none"`)
  * Password (`secureTextEntry={true}`)
* **Behavior:**
  * The form uses `useForm({ resolver: yupResolver(loginSchema) })`.
  * On pressing submit, the `handleSubmit` function checks for errors. If valid, it triggers the `login(data)` API call.
  * **Error Handling:** Displays inline red error text below the respective input if validation fails or if the backend returns "Invalid credentials".

### Register Screen
* **Fields:**
  * Full Name (`autoCapitalize="words"`)
  * Email (`keyboardType="email-address"`, `autoCapitalize="none"`)
  * Password (`secureTextEntry={true}`)
  * Confirm Password (`secureTextEntry={true}`)
* **Behavior:**
  * Managed by `useForm({ resolver: yupResolver(registerSchema) })`.
  * The payload sent to Django looks like: `{ "full_name": "...", "email": "...", "password": "..." }`.
  * **Crucial Note:** There is no `role` key in this payload. Your Django view will handle the logic: `User.objects.create_user(...)` followed by `CustomerProfile.objects.create(user=new_user)`.

## 5. Routing Logic (Post-Success)
Once the Django backend returns a 200 OK (for login) or 201 Created (for register) along with the session cookie, the frontend needs to react.

This is best handled using a Global State (like React Context) to conditionally render your navigation stacks.

**The Flow:**
1. **API Success:** The Axios call resolves successfully.
2. **Update Global State:** You call a function like `setIsAuthenticated(true)` and `setRole('customer')`.
3. **Automatic Routing:** Your root `App.js` listens to `isAuthenticated`.
   * If `false`, it renders the `<AuthNavigator />` (Login/Register screens).
   * If `true`, it unmounts the Auth stack and mounts the `<MainTabNavigator />`, landing the user directly on the Customer Home Tab.

Because React Navigation handles this declaratively based on state, the user is instantly and securely transitioned to the main app interface without needing to manually push a new screen onto the stack.
"""