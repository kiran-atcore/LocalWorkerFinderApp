content = """# Local Worker App - Structure Description

## Customer Mode (Default)

### Home Tab (`CustomerHomeScreen`)
* **Location Banner:** A top header showing the user's current or selected local area (e.g., "Thiruvananthapuram, KL"). Tapping it could open a modal to change the search radius or specific locale.
* **Search Bar:** A text input for querying specific services or worker names.
* **Category Icons:** A horizontal scroll view or grid of quick-filter icons (Plumber, Electrician, Carpenter, Cleaning, etc.).
* **Featured Worker List:** A vertically scrolling list or horizontal carousel highlighting top-rated local professionals, displaying their name, trade, rating, and hourly rate.

### Activity Tab (`CustomerActivityScreen`)
*Implemented via a Top Tab Navigator (e.g., `@react-navigation/material-top-tabs`).*
* **Active Tab:** Displays a list of ongoing requests. Cards show job details and dynamic status badges: `[Pending]` (waiting for worker acceptance) and `[Active]` (worker is on the way or currently working).
* **Past Tab:** A historical log of completed interactions. Status badges include `[Completed]`, `[Cancelled]` (by user), or `[Rejected]` (by worker).

### Profile Tab (`CustomerProfileScreen`)
* **User Details:** Profile picture, name, and contact info.
* **Account Settings:** Options to "Edit Profile," "Logout," and a high-friction "Delete Account" button.
* **Role Toggle Button:** A prominent, styled switch (e.g., "Switch to Worker Mode"). Tapping this updates the global state and triggers the backend to verify if the user has a worker profile initialized; if so, it swaps the UI.

---

## Worker Mode (Toggled State)

### Home Tab (`WorkerHomeScreen`)
* **Location Banner:** Same as the customer view, establishing the service radius.
* **Worker Community / Job Feed:** A real-time or pull-to-refresh list of the "latest jobs" posted by customers in the area that match the worker's registered categories. Workers can tap a job to view details and send an application/quote.

### Activity Tab (`WorkerActivityScreen`)
*Top Tab Navigator (Active / Past)*
* **Active Tab:** List of jobs requiring attention. Status badges are tailored to the worker: `[Incoming]` (a direct request from a customer needing review) and `[Active]` (a job the worker has accepted and is currently executing).
* **Past Tab:** History of the worker's gigs. Badges include `[Completed]`, `[Cancelled]` (by customer), and `[Rejected]` (declined by the worker).

### Profile Tab (`WorkerProfileScreen`)
* **Worker Profile:** Profile picture, business name, rating, and earnings overview.
* **Add New Job Role:** A specific CTA allowing the worker to expand their offerings (e.g., a Plumber adding "HVAC Repair" to their profile). This links to a form validated by Yup.
* **Account Settings:** Options to edit business details, logout, and delete account.
* **Role Toggle Button:** "Switch to Customer Mode" to instantly revert back to the default app experience.
"""