# 🏥 JISCare Employee Scheduler — Full Setup Guide

A complete React + n8n scheduling system for JISCare with AI conflict detection, Google Sheets sync, PDF export, and a dual-role portal (Admin + Employee).

---

## 📁 Project Structure

```
jiscare-scheduler/
├── public/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx       ← Login state & user roles
│   ├── layouts/
│   │   ├── AdminLayout.jsx       ← Protects admin routes
│   │   └── EmployeeLayout.jsx    ← Protects employee routes
│   ├── pages/
│   │   ├── Login.jsx             ← Dual-role login page
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx         ← Overview & stats
│   │   │   ├── CreateSchedule.jsx    ← Shift assignment + week view
│   │   │   ├── EmployeesPage.jsx     ← Employee list + weekly view
│   │   │   ├── ScheduleChecker.jsx   ← AI conflict checker
│   │   │   └── DayOffRequests.jsx    ← Leave management
│   │   └── employee/
│   │       ├── MySchedule.jsx        ← Employee schedule + PDF export
│   │       └── DayOffRequest.jsx     ← Employee leave request
│   ├── components/
│   │   ├── shared/
│   │   │   ├── Sidebar.jsx       ← Navigation sidebar
│   │   │   └── Topbar.jsx        ← Page header bar
│   │   └── ui/
│   │       └── Toast.jsx         ← Notification toasts
│   ├── hooks/
│   │   └── useToast.js           ← Toast notification hook
│   ├── utils/
│   │   ├── api.js                ← n8n webhook URLs & fetch helper
│   │   ├── dateUtils.js          ← Date helpers
│   │   ├── mockData.js           ← Demo data (mirrors Google Sheets)
│   │   └── pdfExport.js          ← jsPDF weekly schedule export
│   ├── styles/
│   │   └── global.css            ← Full design system
│   ├── App.jsx                   ← Router setup
│   └── main.jsx                  ← Entry point
├── index.html
├── package.json
├── vite.config.js
├── .env.example
└── README.md
```

---

## 🚀 Step-by-Step Setup in VS Code

### STEP 1 — Prerequisites

Make sure you have these installed. Open your terminal:

```bash
node --version    # Should be v18+ 
npm --version     # Should be v9+
```

Download Node.js from https://nodejs.org if not installed.

---

### STEP 2 — Create the Project Folder

```bash
# Navigate to where you want the project
cd Desktop

# Create the folder
mkdir jiscare-scheduler
cd jiscare-scheduler
```

---

### STEP 3 — Open in VS Code

```bash
code .
```

This opens VS Code in the `jiscare-scheduler` folder. If `code` command is not found, open VS Code manually and use **File → Open Folder**.

---

### STEP 4 — Create All Files

In VS Code, open the **Terminal** (`` Ctrl+` `` or View → Terminal) and create the folder structure:

```bash
mkdir -p src/pages/admin src/pages/employee src/components/ui src/components/shared src/hooks src/utils src/context src/styles src/layouts
```

Now copy each file listed above into its correct path. The files are:

| File | Purpose |
|------|---------|
| `package.json` | Dependencies |
| `vite.config.js` | Build config |
| `index.html` | HTML entry |
| `src/main.jsx` | React entry |
| `src/App.jsx` | Routes |
| `src/styles/global.css` | Design system |
| `src/context/AuthContext.jsx` | Login auth |
| `src/utils/api.js` | n8n webhooks |
| `src/utils/dateUtils.js` | Date helpers |
| `src/utils/mockData.js` | Demo data |
| `src/utils/pdfExport.js` | PDF export |
| `src/hooks/useToast.js` | Notifications |
| `src/components/shared/Sidebar.jsx` | Nav sidebar |
| `src/components/shared/Topbar.jsx` | Top header |
| `src/components/ui/Toast.jsx` | Toasts |
| `src/layouts/AdminLayout.jsx` | Admin guard |
| `src/layouts/EmployeeLayout.jsx` | Employee guard |
| `src/pages/Login.jsx` | Login |
| `src/pages/admin/Dashboard.jsx` | Dashboard |
| `src/pages/admin/CreateSchedule.jsx` | Scheduler |
| `src/pages/admin/EmployeesPage.jsx` | Employees |
| `src/pages/admin/ScheduleChecker.jsx` | AI Checker |
| `src/pages/admin/DayOffRequests.jsx` | Day offs |
| `src/pages/employee/MySchedule.jsx` | My schedule |
| `src/pages/employee/DayOffRequest.jsx` | Leave request |

---

### STEP 5 — Install Dependencies

```bash
npm install
```

This installs: React, React Router, jsPDF, jsPDF-AutoTable, date-fns, Lucide React, and Vite.

---

### STEP 6 — Configure n8n URL

```bash
# Copy the environment template
cp .env.example .env.local
```

Open `.env.local` and update:

```env
VITE_N8N_BASE_URL=http://YOUR_N8N_IP:5678/webhook
```

Replace `YOUR_N8N_IP` with your actual n8n server IP or domain.

---

### STEP 7 — Run the App

```bash
npm run dev
```

Open your browser at: **http://localhost:5173**

---

## 🔐 Login Credentials

### Admin Portal
| Field | Value |
|-------|-------|
| Employee ID | `ADMIN-001` |
| Password | `admin123` |
| Role | Admin |

### Employee Portal (Demo Employees)
| Employee ID | Password | Name |
|-------------|----------|------|
| `EMP-001` | `emp001` | Maria Santos |
| `EMP-002` | `emp002` | Juan dela Cruz |
| `EMP-003` | `emp003` | Ana Reyes |
| `EMP-004` | `emp004` | Carlos Mendoza |
| `EMP-005` | `emp005` | Rosa Bautista |

---

## 🔗 n8n Webhook Configuration

### Existing Webhooks (already in your n8n)

| Webhook Path | Used By | Description |
|-------------|---------|-------------|
| `POST /webhook/schedule-check` | AI Checker page | Validates shift against conflicts |
| `POST /webhook/dayoff-submit` | Day-Off pages | Submits & validates day-off request |

### New Webhooks to Add in n8n

You need to create **3 new simple webhooks** in n8n:

#### Webhook 1: `POST /webhook/create-shift`

Add to your n8n workflow:
1. **Trigger**: Webhook → Path: `create-shift`
2. **Action**: Google Sheets → Append Row to `Shifts` sheet

Map these columns:
```
Employee_ID  → {{ $json.body.Employee_ID }}
Date         → {{ $json.body.Date }}
Shift_Type   → {{ $json.body.Shift_Type }}
Start_Time   → {{ $json.body.Start_Time }}
End_Time     → {{ $json.body.End_Time }}
Room_ID      → {{ $json.body.Room_ID }}
Notes        → {{ $json.body.Notes }}
```

Then: **Respond to Webhook** → `{ "success": true }`

---

#### Webhook 2: `POST /webhook/get-shifts`

1. **Trigger**: Webhook → Path: `get-shifts`
2. **Action**: Google Sheets → Read Rows from `Shifts` sheet
3. **Respond**: Return the rows as JSON

---

#### Webhook 3: `POST /webhook/send-schedule-email`

1. **Trigger**: Webhook → Path: `send-schedule-email`
2. **Action**: Gmail/SMTP → Send Email

Email template (HTML body):
```html
<h2>Your JISCare Schedule for {{ $json.body.week_label }}</h2>
<p>Hello {{ $json.body.employee_name }},</p>
<table border="1" cellpadding="8">
  <tr><th>Day</th><th>Date</th><th>Shift</th><th>Time</th><th>Room</th></tr>
  <!-- Loop $json.body.shifts -->
</table>
<p>Login to your portal to download your PDF schedule.</p>
```

---

### New Google Sheets Tab: `Weekly_Overview`

Add this tab to your `JISCare_Employee_Scheduler` spreadsheet with columns:

```
Week_Label | Employee_ID | Employee_Name | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Rest_Day
```

You can populate it with a new n8n workflow that runs every Monday:
1. Read all shifts for the week
2. Group by employee
3. Write organized rows to `Weekly_Overview` tab

---

## 🌟 Feature Summary

### Admin Features
| Feature | Page | Description |
|---------|------|-------------|
| Dashboard | `/admin/dashboard` | Stats, today's shifts, quick actions |
| Create Schedule | `/admin/schedule` | Click-to-assign shifts on weekly calendar |
| AI Conflict Check | Built into form | Runs n8n schedule-check webhook before saving |
| Employee Preview | Below form | Shows full week table for selected employee |
| Employee Overview | `/admin/employees` | View all employees, click to see their week |
| Email Schedule | Employees page | Sends weekly schedule to employee email via n8n |
| AI Checker | `/admin/checker` | Standalone conflict checker tool |
| Day-Off Requests | `/admin/dayoff` | Submit & manage leave with AI validation |

### Employee Features
| Feature | Page | Description |
|---------|------|-------------|
| My Schedule | `/employee/my-schedule` | Personal weekly calendar with today highlight |
| PDF Download | Button on My Schedule | Downloads PDF of current week's schedule |
| Day-Off Request | `/employee/dayoff` | Submit leave request with AI feedback |
| Request History | Same page | See past approved/rejected requests |

---

## 📄 PDF Schedule Export

When an employee clicks **Download PDF**, it generates a landscape A4 PDF with:
- JISCare header with teal branding
- Employee name, ID, and week range
- Full 7-day schedule table with color coding
- Rest days highlighted
- Generated timestamp
- Confidential footer

File is saved as: `JISCare_Schedule_EMP-001_Feb_24_Mar_2_2026.pdf`

---

## 🏗️ Build for Production

```bash
# Build optimized files
npm run build

# Preview the build locally
npm run preview
```

The built files will be in `dist/` — deploy this folder to any web host (Netlify, Vercel, Apache, Nginx).

---

## 🔧 Customization

### Add More Employees
Edit `src/utils/mockData.js` → `MOCK_EMPLOYEES` array
Also add credentials to `src/context/AuthContext.jsx` → `MOCK_EMPLOYEES`

### Add More Rooms
Edit `src/utils/mockData.js` → `MOCK_ROOMS` array

### Change n8n URL
Update `src/utils/api.js` or set `VITE_N8N_BASE_URL` in `.env.local`

### Change Colors / Theme
Edit CSS variables at the top of `src/styles/global.css`

---

## 💡 How Schedules Sync to Google Sheets

1. Admin fills the Create Schedule form
2. Clicks **🤖 Check Conflicts (AI)** → calls n8n `schedule-check` webhook
3. n8n reads Employees, Shifts, Rooms from Google Sheets
4. Returns AI decision (clear/conflict)
5. If clear, admin clicks **💾 Save Schedule** → calls n8n `create-shift` webhook
6. n8n appends the new row to the `Shifts` tab in Google Sheets
7. The weekly preview below the form updates instantly in the UI

---

## 📧 Email Notification Flow

1. Admin goes to Employees page
2. Selects an employee → sees their week
3. Clicks **📧 Email Schedule**
4. App calls `send-schedule-email` webhook with schedule data
5. n8n formats and sends email via Gmail/SMTP
6. Employee receives their schedule by email and can also log into their portal

---

*Built for JISCare — Intelligent Employee Scheduling System*
