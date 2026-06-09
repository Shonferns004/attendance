# Attendance System

## Setup on Another Laptop

### 1. Clone / Pull the code
```bash
# If first time:
git clone <repo-url> attendance
cd attendance

# If pulling latest changes:
cd attendance
git pull
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/` with your Supabase credentials:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-jwt-secret
PORT=5000
```
> **Note:** `.env` is in `.gitignore` — it **won't** be deleted or overwritten when you pull. But you need to create it manually on the new laptop. Check the existing laptop's `.env` for the actual values, or create a fresh one with your Supabase credentials.
Start the backend:
```bash
npm start
```
On first run, if the `leaves` table is missing, the server will print the SQL in the console. Copy and run it in your Supabase SQL editor.

### 3. Admin Panel Setup
```bash
cd admin
npm install
npm run dev
```
Runs on `http://localhost:5173` (or next available port).

### 4. Flutter Client Setup
```bash
cd client
flutter pub get
flutter run
```
Make sure a device/emulator is connected. The app connects to the backend at `http://10.0.2.2:5000` (Android emulator) — change the base URL in `lib/services/api_service.dart` if needed.

### 5. Supabase Setup
You'll need a Supabase project. Once you have access:

1. Go to your Supabase dashboard → SQL Editor
2. Run the migration file `backend/supabase/migrations/20260609000000_create_leaves_table.sql`
3. Make sure the `attendance` table exists with columns: `id`, `worker_id`, `date`, `punch_in_time`, `punch_out_time`, `late_minutes`, `status`, `punch_in_lat`, `punch_in_lng`, `punch_out_lat`, `punch_out_lng`
4. Update the `.env` file with your Supabase URL and anon key

If you don't have Supabase access yet, the backend will still start and print the required SQL on each boot.

---

## Changes Made

### 1. Project Cleanup & Setup
- Deleted redundant `users/` folder (duplicate of admin panel)
- Installed npm dependencies for `admin/` and `backend/`
- Fixed Flutter project: renamed pubspec name to `ufs_attendance`, relaxed SDK constraint to `^3.12.0`
- Installed Flutter dependencies (`flutter pub get`)

### 2. Leave Management System (Full Stack)

#### Database
- Created migration file: `backend/supabase/migrations/20260609000000_create_leaves_table.sql`
- Leaves table stores: `worker_id`, `type` (full_day / half_day / vacational), `leave_date`, `half_start_time`, `half_end_time`, `start_date`, `end_date`, `days`, `reason`, `status` (pending / approved / rejected), `admin_remark`

#### Backend (`backend/src/`)
- **`models/leaveModel.js`** — CRUD functions for leaves. Added:
  - `getApprovedHalfDayLeave(workerId, date)` — used by punch-in to adjust late calculation
  - `getApprovedLeaves(workerId)` — used by history endpoint to merge leave days into attendance
- **`controllers/leaveController.js`** — Full leave API with prior-notice validation:
  - Full day: 2 days prior, after 12 PM
  - Half day: 1 day prior
  - Vacational: 30 days prior
- **`routes/leaveRoutes.js`** — Worker routes (apply, my leaves) + Admin routes (list all, list pending, approve/reject)
- **`controllers/attendanceController.js`**:
  - **Punch-in late calculation**: Now checks for approved half-day leave. If found, uses `half_start_time` as effective shift start instead of office start time
  - **`myHistory` endpoint**: Merges approved full-day & vacational leaves into attendance history as `status: 'leave'`. Computes `hours_worked` from punch_in/out times
  - **`listAll` endpoint**: New admin endpoint returning all attendance records with worker info and hours worked
- **`routes/attendanceRoutes.js`** — Added `GET /attendance/all` with admin auth
- **`index.js`** — Startup check that prints CREATE TABLE SQL if `leaves` table is missing

#### Admin Panel (`admin/src/`)
- **`pages/Leaves.jsx`** — New leave management page with Pending/History tabs, approve/reject modal with admin remarks
- **`api/leaves.js`** — Leave API calls
- **`api/attendance.js`** — Attendance records API
- **`pages/Attendance.jsx`** — New attendance records page showing all workers' punch in/out times, hours worked, status, late minutes (searchable table)
- **`App.jsx`** — Added `/attendance` route
- **`components/Sidebar.jsx`** — Added "Attendance" nav item

#### Flutter Client (`client/lib/`)
- **`services/api_service.dart`** — Added `applyLeave()` and `getMyLeaves()` methods
- **`pages/home_page.dart`**:
  - Leave form shown via DraggableScrollableSheet bottom sheet
  - Punch-in hero card with clock, worked timer, fingerprint button
  - Punch-in/punch-out times displayed in card
  - When both punch-in and punch-out are done, button replaced with "Today completed" checkmark
  - Bento stats grid (attendance rate, late balance)
  - Quick actions list
  - Shift times replaced with actual punch-in/punch-out times
- **`pages/leave_page.dart`**:
  - Full leave application form with type dropdown (full_day / half_day / vacational)
  - Conditional fields per type (date picker, time pickers, date range)
  - Date picker respects prior-notice windows (dates disabled accordingly)
  - Leave history list with status badges
  - Accepts `scrollController` from DraggableScrollableSheet for smooth dragging
- **`pages/profile_page.dart`**:
  - Profile card with initials avatar, worker details
  - 4-column stats (P/A/L/Le)
  - Late balance card with progress bar
  - Calendar card with color-coded dots
  - Monthly breakdown with per-status counts and attendance rate
  - Recent Activity card showing last 7 days with date, status dot, and hours worked
  - Logout button
- **`pages/login_page.dart`** — Updated with new theme colors
- **`widgets/mini_calendar.dart`** — 7-column calendar grid with theme colors, status indicators, today highlight
- **`main.dart`** — Full Material theme with `AppColors` extension (MD3 color tokens from HTML design), Inter font mapping, bottom navigation

### 3. Theme & UI Redesign (Flutter)
- All color tokens from HTML design mapped in `AppColors` (primaryFixed, surfaceContainerLow, onTertiaryFixedVariant, outline, etc.)
- Inter font across the app
- Bottom navigation with Home / Profile tabs
- Every page rewritten to match HTML design spec

### 4. Key Decisions
- No leave balance limits — admin decides approval per application
- Leave modal uses `DraggableScrollableSheet` with connected scroll controller
- `'leave'` status is computed at the API level (not stored in attendance table) — merged into history response
- Approved leaves override attendance status in calendar/stats
- Half-day leave adjusts effective shift start time for late-minute calculation

### 5. Still Blocked
- Cannot create `leaves` table in Supabase — user has no access. Migration file saved for later execution. Backend prints SQL on startup if table missing.
