import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/dateUtils'

const ADMIN_NAV = [
  { to: '/admin/dashboard',   icon: '📊', label: 'Dashboard' },
  { to: '/admin/schedule',    icon: '📅', label: 'Create Schedule' },
  { to: '/admin/employees',   icon: '👥', label: 'Employees' },
  { to: '/admin/checker',     icon: '🤖', label: 'AI Conflict Checker' },
  { to: '/admin/dayoff',      icon: '🗓️', label: 'Day-Off Requests' },
]

const EMP_NAV = [
  { to: '/employee/my-schedule', icon: '📅', label: 'My Schedule' },
  { to: '/employee/dayoff',      icon: '✈️', label: 'Request Day Off' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const nav = user?.role === 'admin' ? ADMIN_NAV : EMP_NAV

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">🏥</div>
          <div className="logo-text">
            <span className="logo-name">JISCare</span>
            <span className="logo-sub">Scheduler System</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">
          {user?.role === 'admin' ? 'Management' : 'My Portal'}
        </div>
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="avatar">{getInitials(user?.name)}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.position || user?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-item"
          style={{ width:'100%', marginTop: 8, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)' }}
        >
          <span>🚪</span><span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
