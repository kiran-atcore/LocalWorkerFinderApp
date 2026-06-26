# Email OTP Verification Implementation Plan

This plan outlines the steps to implement Email OTP verification during the registration process, including backend models/views and frontend screens with timer logic.

## 1. Backend Changes (Django)

### A. New Database Model
Add an `EmailOTP` model to `backend/users/models.py`:
- `email`: Email address being registered.
- `otp_code`: 6-digit string.
- `registration_data`: JSON field storing the user's name, password, and chosen role (since the user isn't created in the database until they verify).
- `attempts`: Integer tracking failed attempts.
- `created_at`: Timestamp for expiry tracking.

### B. View Updates (`backend/users/views.py`)
1. **Modify `RegisterView`**:
   - Instead of instantly creating the user and logging them in, validate the data, generate a 6-digit OTP, and save it alongside their `registration_data` in the `EmailOTP` table.
   - Print the OTP to the terminal for testing.
   - Return a success response telling the frontend to proceed to the OTP screen.
2. **Create `VerifyOTPView`**:
   - Accepts `email` and `otp_code`.
   - Validates if the OTP is expired (> 4 mins).
   - Checks if the code matches. If incorrect, increments `attempts`. If `attempts` hits 3, deletes the OTP record and returns a specific "max attempts" error.
   - If correct, pulls the `registration_data`, securely creates the `User` in the database, logs them in, deletes the OTP record, and returns the user data.
3. **Create `ResendOTPView`**:
   - Accepts `email`, generates a new OTP, resets attempts to 0, updates the `EmailOTP` record, and prints to the terminal.

### C. URLs (`backend/users/urls.py`)
- Add paths for `verify-otp/` and `resend-otp/`.

---

## 2. Frontend Changes (Expo / React Native)

### A. Update `register.tsx`
- Change the `onSubmit` handler to navigate to `/(auth)/otp?email=${email}` upon successful API response, instead of updating global auth state.

### B. Implement `otp.tsx`
Create the new screen with the following features:
- **UI**: A clean layout with a text input for the 6-digit OTP.
- **Expiry Timer (4 Mins)**: A countdown displaying time remaining until the OTP expires. If it expires, prompt the user to request a new one.
- **Resend Timer (1 Min)**: The "Resend OTP" button will be disabled and show a countdown for 60 seconds before becoming active.
- **Attempt Tracking**: Tracks failed attempts. If the backend returns a "max attempts reached" error (or local count hits 3), show an alert and use `router.replace('/(auth)/register')` to send them back.
- **Verification**: On successful verify, calls `setAuth(user)` in Zustand and routes to `/(tabs)/home`.

## User Review Required
- **Testing Constraints**: Since no real email provider (like SendGrid) is configured yet, the OTPs will strictly be printed to your active Django terminal. You will read them from the terminal to test the app.
- **Registration Flow**: Are there any additional fields passed during registration (like profile photos) that need to be cached in the JSON `registration_data` before the user is officially created? (Currently, it just handles first name, last name, email, password, and role).

Please review and approve this plan so I can begin execution.
