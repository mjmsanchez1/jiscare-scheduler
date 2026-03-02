import { createContext, useContext, useState, useEffect } from 'react'
import { loadAuthDB, saveAuthEntry, deleteAuthEntry, MOCK_EMPLOYEES, refreshEmployees, bootstrapFromSheets } from '../utils/mockData'

const AuthContext = createContext(null)

const ADMIN_PROFILE = {
  id:       'ADMIN-001',
  name:     'Admin User',
  role:     'admin',
  dept:     'Management',
  position: 'Scheduler Admin',
  email:    'admin@jiscare.com',
}

function buildUserSession(authEntry) {
  if (authEntry.role === 'admin') return ADMIN_PROFILE
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
  const [user, setUser]         = useState(null)
  const [appReady, setAppReady] = useState(false)

  // On mount: load latest data from Google Sheets, then restore session
  useEffect(() => {
    async function init() {
      // Pull fresh data from Sheets (employees, shifts, dayoffs)
      // This ensures cross-device sync on every app load
      await bootstrapFromSheets().catch(() => {})

      // Restore session from localStorage if still valid
      try {
        const saved = localStorage.getItem('jiscare_user')
        if (saved) {
          const parsed  = JSON.parse(saved)
          const authDB  = loadAuthDB()
          const authEntry = authDB.find(u => u.id === parsed.id)
          if (authEntry) {
            const fresh = buildUserSession(authEntry)
            if (fresh) {
              setUser(fresh)
              localStorage.setItem('jiscare_user', JSON.stringify(fresh))
            }
          }
        }
      } catch {}

      setAppReady(true)
    }
    init()
  }, [])

  const login = (employeeId, password) => {
    const authDB    = loadAuthDB()
    const authEntry = authDB.find(u => u.id === employeeId && u.password === password)
    if (!authEntry) return { success: false, error: 'Invalid Employee ID or Password' }

    const session = buildUserSession(authEntry)
    if (!session) return { success: false, error: 'Employee profile not found' }

    setUser(session)
    localStorage.setItem('jiscare_user', JSON.stringify(session))
    return { success: true, user: session }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('jiscare_user')
  }

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

  // Add a new employee to auth DB + optionally sync to Sheets
  const addEmployeeAuth = (entry) => {
    saveAuthEntry(entry)
  }

  const removeEmployeeAuth = (id) => {
    deleteAuthEntry(id)
  }

  // Show a loading screen while bootstrapping
  if (!appReady) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--c-bg, #f8fafb)', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #e2e8f0',
          borderTop: '4px solid #0d7377', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
          Loading JISCare…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshSession, addEmployeeAuth, removeEmployeeAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
