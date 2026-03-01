import { createContext, useContext, useState } from 'react'
import { loadAuthDB, MOCK_EMPLOYEES, refreshEmployees } from '../utils/mockData'

const AuthContext = createContext(null)

// Admin is hard-coded (not in the employee DB)
const ADMIN_PROFILE = {
  id: 'ADMIN-001',
  name: 'Admin User',
  role: 'admin',
  dept: 'Management',
  position: 'Scheduler Admin',
  email: 'admin@jiscare.com',
}

function buildUserSession(authEntry) {
  if (authEntry.role === 'admin') return ADMIN_PROFILE

  // Pull the latest profile from the employee DB
  const employees = refreshEmployees()
  const profile   = employees.find(e => e.Employee_ID === authEntry.id)
  if (!profile) return null

  return {
    id:       profile.Employee_ID,
    name:     profile.Name,
    role:     'employee',
    dept:     profile.Department,
    position: profile.Position,
    email:    profile.Email,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('jiscare_user')
      if (!saved) return null
      const parsed = JSON.parse(saved)

      // Re-hydrate the session from the live DB so name/position are always fresh
      const authDB  = loadAuthDB()
      const authEntry = authDB.find(u => u.id === parsed.id)
      if (!authEntry) return null

      const fresh = buildUserSession(authEntry)
      if (!fresh) return null

      // Persist fresh copy back (handles edits made while logged out)
      localStorage.setItem('jiscare_user', JSON.stringify(fresh))
      return fresh
    } catch {
      return null
    }
  })

  const login = (employeeId, password) => {
    const authDB    = loadAuthDB()
    const authEntry = authDB.find(u => u.id === employeeId && u.password === password)

    if (!authEntry) {
      return { success: false, error: 'Invalid Employee ID or Password' }
    }

    const session = buildUserSession(authEntry)
    if (!session) {
      return { success: false, error: 'Employee profile not found in database' }
    }

    setUser(session)
    localStorage.setItem('jiscare_user', JSON.stringify(session))
    return { success: true, user: session }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('jiscare_user')
  }

  // Call this after editing an employee's profile so the sidebar / greeting refreshes
  const refreshSession = () => {
    if (!user) return
    const authDB    = loadAuthDB()
    const authEntry = authDB.find(u => u.id === user.id)
    if (!authEntry) return
    const fresh = buildUserSession(authEntry)
    if (fresh) {
      setUser(fresh)
      localStorage.setItem('jiscare_user', JSON.stringify(fresh))
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}