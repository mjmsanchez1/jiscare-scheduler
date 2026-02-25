import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// Mock employee database — replace with real API
const MOCK_EMPLOYEES = [
  { id: 'EMP-001', name: 'Maria Santos',    role: 'employee', dept: 'Nursing',   position: 'Senior Nurse',     email: 'maria@jiscare.com',   password: 'emp001' },
  { id: 'EMP-002', name: 'Juan dela Cruz',  role: 'employee', dept: 'Therapy',   position: 'Physiotherapist',  email: 'juan@jiscare.com',    password: 'emp002' },
  { id: 'EMP-003', name: 'Ana Reyes',       role: 'employee', dept: 'Nursing',   position: 'Staff Nurse',      email: 'ana@jiscare.com',     password: 'emp003' },
  { id: 'EMP-004', name: 'Carlos Mendoza',  role: 'employee', dept: 'Admin',     position: 'Care Coordinator', email: 'carlos@jiscare.com',  password: 'emp004' },
  { id: 'EMP-005', name: 'Rosa Bautista',   role: 'employee', dept: 'Therapy',   position: 'Occupational Therapist', email: 'rosa@jiscare.com', password: 'emp005' },
  { id: 'ADMIN-001', name: 'Admin User',    role: 'admin',    dept: 'Management',position: 'Scheduler Admin',  email: 'admin@jiscare.com',   password: 'admin123' },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('jiscare_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = (employeeId, password, role) => {
    const found = MOCK_EMPLOYEES.find(e =>
      e.id === employeeId &&
      e.password === password &&
      (role === 'admin' ? e.role === 'admin' : e.role === 'employee')
    )
    if (found) {
      const { password: _, ...safe } = found
      setUser(safe)
      localStorage.setItem('jiscare_user', JSON.stringify(safe))
      return { success: true, user: safe }
    }
    return { success: false, error: 'Invalid credentials' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('jiscare_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, MOCK_EMPLOYEES }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
