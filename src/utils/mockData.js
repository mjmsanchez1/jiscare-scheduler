// ============================================================
// JISCare — Data Store
// Employees are persisted to localStorage (acts as local DB)
// In production, all reads/writes go through n8n webhooks
// ============================================================

const STORAGE_KEY_EMPLOYEES = 'jiscare_employees_db'
const STORAGE_KEY_AUTH      = 'jiscare_auth_db'

// ── Default seed data ────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────
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

// ── Auth credential DB ────────────────────────────────────────
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

// ── Static data ───────────────────────────────────────────────
export const MOCK_ROOMS = [
  { Room_ID: 'ROOM-01', Room_Name: 'Room 101 — General',  Capacity: 4, Location: 'Ground Floor' },
  { Room_ID: 'ROOM-02', Room_Name: 'Room 102 — ICU',      Capacity: 2, Location: 'Ground Floor' },
  { Room_ID: 'ROOM-03', Room_Name: 'Room 201 — Therapy',  Capacity: 3, Location: 'Second Floor' },
  { Room_ID: 'ROOM-04', Room_Name: 'Room 202 — Recovery', Capacity: 4, Location: 'Second Floor' },
]

// ── Shift data (in-memory; connect to n8n/Sheets in prod) ────
export let MOCK_SHIFTS = [
  { Employee_ID: 'EMP-001', Date: '2026-02-24', Shift_Type: 'Morning',   Start_Time: '7:30 AM',  End_Time: '12:30 PM', Room_ID: 'ROOM-01', Notes: '' },
  { Employee_ID: 'EMP-002', Date: '2026-02-24', Shift_Type: 'Morning',   Start_Time: '7:30 AM',  End_Time: '12:30 PM', Room_ID: 'ROOM-02', Notes: '' },
  { Employee_ID: 'EMP-003', Date: '2026-02-24', Shift_Type: 'Afternoon', Start_Time: '12:30 PM', End_Time: '5:30 PM',  Room_ID: 'ROOM-01', Notes: '' },
  { Employee_ID: 'EMP-001', Date: '2026-02-25', Shift_Type: 'Morning',   Start_Time: '7:30 AM',  End_Time: '12:30 PM', Room_ID: 'ROOM-01', Notes: '' },
  { Employee_ID: 'EMP-002', Date: '2026-02-25', Shift_Type: 'Afternoon', Start_Time: '12:30 PM', End_Time: '5:30 PM',  Room_ID: 'ROOM-03', Notes: '' },
  { Employee_ID: 'EMP-003', Date: '2026-02-25', Shift_Type: 'OFF',       Start_Time: '',          End_Time: '',        Room_ID: '',         Notes: 'Rest Day' },
  { Employee_ID: 'EMP-004', Date: '2026-02-25', Shift_Type: 'Morning',   Start_Time: '7:30 AM',  End_Time: '12:30 PM', Room_ID: 'ROOM-04', Notes: '' },
  { Employee_ID: 'EMP-005', Date: '2026-02-26', Shift_Type: 'Afternoon', Start_Time: '12:30 PM', End_Time: '5:30 PM',  Room_ID: 'ROOM-03', Notes: '' },
]

export function addMockShift(shift) { MOCK_SHIFTS.push(shift) }
export function getMockShiftsForEmployee(id) { return MOCK_SHIFTS.filter(s => s.Employee_ID === id) }
export function getMockShiftsForWeek(dates) {
  const iso = new Set(dates.map(d => d.toISOString().split('T')[0]))
  return MOCK_SHIFTS.filter(s => iso.has(s.Date))
}