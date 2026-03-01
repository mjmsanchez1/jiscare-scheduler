// ============================================================
// JISCare — Shared Data Store
// ALL data is persisted to localStorage so admin changes are
// immediately visible to employee pages in the same browser.
// ============================================================

const STORAGE_KEY_EMPLOYEES = 'jiscare_employees_db'
const STORAGE_KEY_AUTH      = 'jiscare_auth_db'
const STORAGE_KEY_SHIFTS    = 'jiscare_shifts_db'
const STORAGE_KEY_DAYOFF    = 'jiscare_dayoff_db'

const SEED_EMPLOYEES = [
  { Employee_ID: 'EMP-001', Name: 'Maria Santos',   Department: 'Nursing',  Position: 'Senior Nurse',           Email: 'maria@jiscare.com'  },
  { Employee_ID: 'EMP-002', Name: 'Juan dela Cruz', Department: 'Therapy',  Position: 'Physiotherapist',        Email: 'juan@jiscare.com'   },
  { Employee_ID: 'EMP-003', Name: 'Ana Reyes',      Department: 'Nursing',  Position: 'Staff Nurse',            Email: 'ana@jiscare.com'    },
  { Employee_ID: 'EMP-004', Name: 'Carlos Mendoza', Department: 'Admin',    Position: 'Care Coordinator',       Email: 'carlos@jiscare.com' },
  { Employee_ID: 'EMP-005', Name: 'Rosa Bautista',  Department: 'Therapy',  Position: 'Occupational Therapist', Email: 'rosa@jiscare.com'   },
]

const SEED_AUTH = [
  { id: 'EMP-001',   password: 'emp001',   role: 'employee' },
  { id: 'EMP-002',   password: 'emp002',   role: 'employee' },
  { id: 'EMP-003',   password: 'emp003',   role: 'employee' },
  { id: 'EMP-004',   password: 'emp004',   role: 'employee' },
  { id: 'EMP-005',   password: 'emp005',   role: 'employee' },
  { id: 'ADMIN-001', password: 'admin123', role: 'admin'    },
]

const SEED_SHIFTS = [
  { Employee_ID: 'EMP-001', Date: '2026-02-24', Shift_Type: 'Morning',   Start_Time: '7:30 AM',  End_Time: '12:30 PM', Room_ID: 'ROOM-01', Notes: '' },
  { Employee_ID: 'EMP-002', Date: '2026-02-24', Shift_Type: 'Morning',   Start_Time: '7:30 AM',  End_Time: '12:30 PM', Room_ID: 'ROOM-02', Notes: '' },
  { Employee_ID: 'EMP-003', Date: '2026-02-24', Shift_Type: 'Afternoon', Start_Time: '12:30 PM', End_Time: '5:30 PM',  Room_ID: 'ROOM-01', Notes: '' },
  { Employee_ID: 'EMP-001', Date: '2026-02-25', Shift_Type: 'Morning',   Start_Time: '7:30 AM',  End_Time: '12:30 PM', Room_ID: 'ROOM-01', Notes: '' },
  { Employee_ID: 'EMP-002', Date: '2026-02-25', Shift_Type: 'Afternoon', Start_Time: '12:30 PM', End_Time: '5:30 PM',  Room_ID: 'ROOM-03', Notes: '' },
  { Employee_ID: 'EMP-003', Date: '2026-02-25', Shift_Type: 'OFF',       Start_Time: '',         End_Time: '',         Room_ID: '',         Notes: 'Rest Day' },
  { Employee_ID: 'EMP-004', Date: '2026-02-25', Shift_Type: 'Morning',   Start_Time: '7:30 AM',  End_Time: '12:30 PM', Room_ID: 'ROOM-04', Notes: '' },
  { Employee_ID: 'EMP-005', Date: '2026-02-26', Shift_Type: 'Afternoon', Start_Time: '12:30 PM', End_Time: '5:30 PM',  Room_ID: 'ROOM-03', Notes: '' },
]

const SEED_DAYOFF = [
  { id: 'DO-001', Employee_ID: 'EMP-001', Employee_Name: 'Maria Santos',   Date: '2026-03-10', Status: 'Approved', Reason: 'Family event',    Requested_On: '2026-02-20', Manager_Note: 'Approved as no conflicts found.' },
  { id: 'DO-002', Employee_ID: 'EMP-003', Employee_Name: 'Ana Reyes',      Date: '2026-03-12', Status: 'Rejected', Reason: 'Personal errand', Requested_On: '2026-02-21', Manager_Note: 'Rejected: shift conflict detected.' },
  { id: 'DO-003', Employee_ID: 'EMP-002', Employee_Name: 'Juan dela Cruz', Date: '2026-03-15', Status: 'Pending',  Reason: 'Medical checkup', Requested_On: '2026-02-22', Manager_Note: '' },
]

function loadFromStorage(key, seed) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(key, JSON.stringify(seed))
  return [...seed]
}

function saveToStorage(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

// ── Employee DB ───────────────────────────────────────────────
export let MOCK_EMPLOYEES = loadFromStorage(STORAGE_KEY_EMPLOYEES, SEED_EMPLOYEES)

export function refreshEmployees() {
  MOCK_EMPLOYEES = loadFromStorage(STORAGE_KEY_EMPLOYEES, SEED_EMPLOYEES)
  return MOCK_EMPLOYEES
}

export function getNextEmployeeId() {
  const nums = MOCK_EMPLOYEES
    .map(e => e.Employee_ID)
    .filter(id => /^EMP-\d+$/.test(id))
    .map(id => parseInt(id.replace('EMP-', ''), 10))
  const max = nums.length ? Math.max(...nums) : 0
  return `EMP-${String(max + 1).padStart(3, '0')}`
}

export function addEmployee(emp) {
  MOCK_EMPLOYEES = [...MOCK_EMPLOYEES, emp]
  saveToStorage(STORAGE_KEY_EMPLOYEES, MOCK_EMPLOYEES)
}

export function updateEmployee(id, updates) {
  MOCK_EMPLOYEES = MOCK_EMPLOYEES.map(e =>
    e.Employee_ID === id ? { ...e, ...updates } : e
  )
  saveToStorage(STORAGE_KEY_EMPLOYEES, MOCK_EMPLOYEES)
}

export function deleteEmployee(id) {
  MOCK_EMPLOYEES = MOCK_EMPLOYEES.filter(e => e.Employee_ID !== id)
  saveToStorage(STORAGE_KEY_EMPLOYEES, MOCK_EMPLOYEES)
}

// ── Auth DB ───────────────────────────────────────────────────
export function loadAuthDB() {
  return loadFromStorage(STORAGE_KEY_AUTH, SEED_AUTH)
}

export function saveAuthEntry(entry) {
  const db = loadAuthDB()
  const idx = db.findIndex(u => u.id === entry.id)
  if (idx !== -1) db[idx] = { ...db[idx], ...entry }
  else db.push(entry)
  saveToStorage(STORAGE_KEY_AUTH, db)
}

export function deleteAuthEntry(id) {
  const db = loadAuthDB().filter(u => u.id !== id)
  saveToStorage(STORAGE_KEY_AUTH, db)
}

// ── Rooms (static) ────────────────────────────────────────────
export const MOCK_ROOMS = [
  { Room_ID: 'ROOM-01', Room_Name: 'Room 101 — General',  Capacity: 4, Location: 'Ground Floor' },
  { Room_ID: 'ROOM-02', Room_Name: 'Room 102 — ICU',      Capacity: 2, Location: 'Ground Floor' },
  { Room_ID: 'ROOM-03', Room_Name: 'Room 201 — Therapy',  Capacity: 3, Location: 'Second Floor' },
  { Room_ID: 'ROOM-04', Room_Name: 'Room 202 — Recovery', Capacity: 4, Location: 'Second Floor' },
]

// ── Shift DB — persisted ──────────────────────────────────────
export function loadShifts() {
  return loadFromStorage(STORAGE_KEY_SHIFTS, SEED_SHIFTS)
}

export let MOCK_SHIFTS = loadShifts()

export function refreshShifts() {
  MOCK_SHIFTS = loadShifts()
  return MOCK_SHIFTS
}

// Upsert: replaces existing shift for same employee+date, or appends
export function saveShift(shift) {
  const all = loadShifts()
  const idx = all.findIndex(s => s.Employee_ID === shift.Employee_ID && s.Date === shift.Date)
  if (idx !== -1) all[idx] = shift
  else all.push(shift)
  MOCK_SHIFTS = all
  saveToStorage(STORAGE_KEY_SHIFTS, all)
}

// Backward-compat alias — now also persists
export function addMockShift(shift) {
  saveShift(shift)
}

export function deleteShift(employeeId, date) {
  const all = loadShifts().filter(s => !(s.Employee_ID === employeeId && s.Date === date))
  MOCK_SHIFTS = all
  saveToStorage(STORAGE_KEY_SHIFTS, all)
}

export function getMockShiftsForEmployee(id) {
  return loadShifts().filter(s => s.Employee_ID === id)
}

export function getMockShiftsForWeek(dates) {
  const iso = new Set(dates.map(d => d.toISOString().split('T')[0]))
  return loadShifts().filter(s => iso.has(s.Date))
}

// ── Day-Off Request DB — persisted ───────────────────────────
export function loadDayOffRequests() {
  return loadFromStorage(STORAGE_KEY_DAYOFF, SEED_DAYOFF)
}

export function saveDayOffRequest(request) {
  const all = loadDayOffRequests()
  const idx = all.findIndex(r => r.id === request.id)
  if (idx !== -1) all[idx] = request
  else all.push(request)
  saveToStorage(STORAGE_KEY_DAYOFF, all)
  return request
}

export function getDayOffRequestsForEmployee(employeeId) {
  return loadDayOffRequests().filter(r => r.Employee_ID === employeeId)
}

export function updateDayOffStatus(id, status, managerNote = '') {
  const all = loadDayOffRequests()
  const idx = all.findIndex(r => r.id === id)
  if (idx !== -1) {
    all[idx] = { ...all[idx], Status: status, Manager_Note: managerNote }
    saveToStorage(STORAGE_KEY_DAYOFF, all)
  }
}