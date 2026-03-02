// ============================================================
// JISCare — Data Store
//
// ARCHITECTURE:
//   Google Sheets (via n8n) = source of truth (cross-device)
//   localStorage            = offline cache only
//
// All mutations call n8n to write to Google Sheets.
// On startup, the app loads fresh data from Google Sheets
// and updates the local cache.
// ============================================================

import { API, n8nPost } from './api'

// ── Storage Keys ─────────────────────────────────────────────
const KEYS = {
  EMPLOYEES: 'jiscare_employees_db',
  AUTH:      'jiscare_auth_db',
  SHIFTS:    'jiscare_shifts_db',
  DAYOFF:    'jiscare_dayoff_db',
}

// ── Seed Data (used only when both n8n AND cache are empty) ──
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
]

const SEED_DAYOFF = []

// ── localStorage helpers ──────────────────────────────────────
function lsGet(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback } catch { return fallback }
}
function lsSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

// ── In-memory mirrors (kept in sync with cache + n8n) ────────
export let MOCK_EMPLOYEES = lsGet(KEYS.EMPLOYEES, SEED_EMPLOYEES)
export let MOCK_SHIFTS    = lsGet(KEYS.SHIFTS,    SEED_SHIFTS)
export let MOCK_ROOMS = [
  { Room_ID: 'ROOM-01', Room_Name: 'Room 101 — General',  Capacity: 4, Location: 'Ground Floor' },
  { Room_ID: 'ROOM-02', Room_Name: 'Room 102 — ICU',      Capacity: 2, Location: 'Ground Floor' },
  { Room_ID: 'ROOM-03', Room_Name: 'Room 201 — Therapy',  Capacity: 3, Location: 'Second Floor' },
  { Room_ID: 'ROOM-04', Room_Name: 'Room 202 — Recovery', Capacity: 4, Location: 'Second Floor' },
]

// ── Bootstrap: load everything from Google Sheets via n8n ────
// Call this once on app startup. Returns { employees, shifts, dayoffs }
export async function bootstrapFromSheets() {
  const results = { employees: null, shifts: null, dayoffs: null }

  try {
    const empRes = await n8nPost(API.GET_EMPLOYEES, {})
    if (empRes?.data?.length) {
      MOCK_EMPLOYEES = empRes.data
      lsSet(KEYS.EMPLOYEES, MOCK_EMPLOYEES)
      results.employees = MOCK_EMPLOYEES
    }
  } catch { /* n8n offline — use local cache */ }

  try {
    const shiftRes = await n8nPost(API.GET_SHIFTS, {})
    if (shiftRes?.data?.length) {
      MOCK_SHIFTS = shiftRes.data
      lsSet(KEYS.SHIFTS, MOCK_SHIFTS)
      results.shifts = MOCK_SHIFTS
    }
  } catch { /* offline */ }

  try {
    const dayoffRes = await n8nPost(API.GET_DAYOFFS, {})
    if (dayoffRes?.data?.length) {
      lsSet(KEYS.DAYOFF, dayoffRes.data)
      results.dayoffs = dayoffRes.data
    }
  } catch { /* offline */ }

  return results
}

// ── Employee functions ────────────────────────────────────────
export function refreshEmployees() {
  MOCK_EMPLOYEES = lsGet(KEYS.EMPLOYEES, SEED_EMPLOYEES)
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
  MOCK_EMPLOYEES = [...MOCK_EMPLOYEES.filter(e => e.Employee_ID !== emp.Employee_ID), emp]
  lsSet(KEYS.EMPLOYEES, MOCK_EMPLOYEES)
}

export function updateEmployee(id, updates) {
  MOCK_EMPLOYEES = MOCK_EMPLOYEES.map(e => e.Employee_ID === id ? { ...e, ...updates } : e)
  lsSet(KEYS.EMPLOYEES, MOCK_EMPLOYEES)
}

export function deleteEmployee(id) {
  MOCK_EMPLOYEES = MOCK_EMPLOYEES.filter(e => e.Employee_ID !== id)
  lsSet(KEYS.EMPLOYEES, MOCK_EMPLOYEES)
}

// ── Auth DB functions ─────────────────────────────────────────
export function loadAuthDB() {
  return lsGet(KEYS.AUTH, SEED_AUTH)
}

export function saveAuthEntry(entry) {
  const db  = loadAuthDB()
  const idx = db.findIndex(u => u.id === entry.id)
  if (idx !== -1) db[idx] = { ...db[idx], ...entry }
  else db.push(entry)
  lsSet(KEYS.AUTH, db)
}

export function deleteAuthEntry(id) {
  lsSet(KEYS.AUTH, loadAuthDB().filter(u => u.id !== id))
}

// ── Shift functions ───────────────────────────────────────────
export function loadShifts() {
  MOCK_SHIFTS = lsGet(KEYS.SHIFTS, SEED_SHIFTS)
  return MOCK_SHIFTS
}

export function refreshShifts() {
  return loadShifts()
}

export function saveShift(shift) {
  const all = loadShifts()
  const idx = all.findIndex(s => s.Employee_ID === shift.Employee_ID && s.Date === shift.Date)
  if (idx !== -1) all[idx] = shift
  else all.push(shift)
  MOCK_SHIFTS = all
  lsSet(KEYS.SHIFTS, all)
}

export function addMockShift(shift) { saveShift(shift) }

export function deleteShift(employeeId, date) {
  const all = loadShifts().filter(s => !(s.Employee_ID === employeeId && s.Date === date))
  MOCK_SHIFTS = all
  lsSet(KEYS.SHIFTS, all)
}

export function getMockShiftsForEmployee(id) {
  return loadShifts().filter(s => s.Employee_ID === id)
}

export function getMockShiftsForWeek(dates) {
  const iso = new Set(dates.map(d => d.toISOString().split('T')[0]))
  return loadShifts().filter(s => iso.has(s.Date))
}

// ── Day-Off functions ─────────────────────────────────────────
export function loadDayOffRequests() {
  return lsGet(KEYS.DAYOFF, SEED_DAYOFF)
}

export function saveDayOffRequest(request) {
  const all = loadDayOffRequests()
  const idx = all.findIndex(r => r.id === request.id)
  if (idx !== -1) all[idx] = request
  else all.push(request)
  lsSet(KEYS.DAYOFF, all)
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
    lsSet(KEYS.DAYOFF, all)
  }
}
