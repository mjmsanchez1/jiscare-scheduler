// Mock in-memory store — acts as local cache of Google Sheets data
// In production, all reads/writes go through n8n webhooks

export const MOCK_EMPLOYEES = [
  { Employee_ID: 'EMP-001', Name: 'Maria Santos',    Department: 'Nursing',   Position: 'Senior Nurse',           Email: 'maria@jiscare.com'   },
  { Employee_ID: 'EMP-002', Name: 'Juan dela Cruz',  Department: 'Therapy',   Position: 'Physiotherapist',        Email: 'juan@jiscare.com'    },
  { Employee_ID: 'EMP-003', Name: 'Ana Reyes',       Department: 'Nursing',   Position: 'Staff Nurse',            Email: 'ana@jiscare.com'     },
  { Employee_ID: 'EMP-004', Name: 'Carlos Mendoza',  Department: 'Admin',     Position: 'Care Coordinator',       Email: 'carlos@jiscare.com'  },
  { Employee_ID: 'EMP-005', Name: 'Rosa Bautista',   Department: 'Therapy',   Position: 'Occupational Therapist', Email: 'rosa@jiscare.com'    },
]

export const MOCK_ROOMS = [
  { Room_ID: 'ROOM-01', Room_Name: 'Room 101 — General',    Capacity: 4, Location: 'Ground Floor' },
  { Room_ID: 'ROOM-02', Room_Name: 'Room 102 — ICU',        Capacity: 2, Location: 'Ground Floor' },
  { Room_ID: 'ROOM-03', Room_Name: 'Room 201 — Therapy',    Capacity: 3, Location: 'Second Floor' },
  { Room_ID: 'ROOM-04', Room_Name: 'Room 202 — Recovery',   Capacity: 4, Location: 'Second Floor' },
]

// Simulated shifts (from the CSV data)
export let MOCK_SHIFTS = [
  { Employee_ID: 'EMP-001', Date: '2026-02-24', Shift_Type: 'Morning',   Start_Time: '7:30 AM',  End_Time: '12:30 PM', Room_ID: 'ROOM-01', Notes: '' },
  { Employee_ID: 'EMP-002', Date: '2026-02-24', Shift_Type: 'Morning',   Start_Time: '7:30 AM',  End_Time: '12:30 PM', Room_ID: 'ROOM-02', Notes: '' },
  { Employee_ID: 'EMP-003', Date: '2026-02-24', Shift_Type: 'Afternoon', Start_Time: '12:30 PM', End_Time: '5:30 PM',  Room_ID: 'ROOM-01', Notes: '' },
  { Employee_ID: 'EMP-001', Date: '2026-02-25', Shift_Type: 'Morning',   Start_Time: '7:30 AM',  End_Time: '12:30 PM', Room_ID: 'ROOM-01', Notes: '' },
  { Employee_ID: 'EMP-002', Date: '2026-02-25', Shift_Type: 'Afternoon', Start_Time: '12:30 PM', End_Time: '5:30 PM',  Room_ID: 'ROOM-03', Notes: '' },
  { Employee_ID: 'EMP-003', Date: '2026-02-25', Shift_Type: 'OFF',       Start_Time: '',          End_Time: '',         Room_ID: '',        Notes: 'Rest Day' },
  { Employee_ID: 'EMP-004', Date: '2026-02-25', Shift_Type: 'Morning',   Start_Time: '7:30 AM',  End_Time: '12:30 PM', Room_ID: 'ROOM-04', Notes: '' },
  { Employee_ID: 'EMP-005', Date: '2026-02-26', Shift_Type: 'Afternoon', Start_Time: '12:30 PM', End_Time: '5:30 PM',  Room_ID: 'ROOM-03', Notes: '' },
]

export function addMockShift(shift) {
  MOCK_SHIFTS.push(shift)
}

export function getMockShiftsForEmployee(employeeId) {
  return MOCK_SHIFTS.filter(s => s.Employee_ID === employeeId)
}

export function getMockShiftsForWeek(dates) {
  const isoSet = new Set(dates.map(d => d.toISOString().split('T')[0]))
  return MOCK_SHIFTS.filter(s => isoSet.has(s.Date))
}
