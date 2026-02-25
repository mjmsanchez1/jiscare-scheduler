import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('admin')
  const [empId, setEmpId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/employee/my-schedule'} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const result = login(empId.trim().toUpperCase(), password, role)
    setLoading(false)
    if (result.success) {
      navigate(result.user.role === 'admin' ? '/admin/dashboard' : '/employee/my-schedule')
    } else {
      setError('Invalid Employee ID or password. Please try again.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand animate-fade-up">
          <div className="brand-icon">🏥</div>
          <h1>JISCare</h1>
          <p>Intelligent Employee Scheduling System</p>
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { icon: '🤖', title: 'AI-Powered Checker', desc: 'Automatic conflict detection with smart suggestions' },
              { icon: '📅', title: 'Weekly Scheduling', desc: 'Visual weekly planner with Google Sheets sync' },
              { icon: '📄', title: 'PDF Export', desc: 'Download your personal schedule anytime' },
            ].map((f, i) => (
              <div key={i} style={{ display:'flex', gap:16, textAlign:'left', animationDelay:`${i*0.1}s` }} className="animate-fade-up">
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 }}>{f.icon}</div>
                <div>
                  <div style={{ color:'#fff', fontWeight:700, fontSize:'0.9rem' }}>{f.title}</div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.8rem', marginTop:3 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrap animate-fade-up">
          <h2>Welcome back</h2>
          <p>Sign in to access your scheduling portal</p>

          <div className="login-role-tabs">
            <button className={`login-role-tab ${role==='admin' ? 'active':''}`} onClick={() => { setRole('admin'); setEmpId(''); setPassword('') }}>
              🔐 Admin
            </button>
            <button className={`login-role-tab ${role==='employee' ? 'active':''}`} onClick={() => { setRole('employee'); setEmpId(''); setPassword('') }}>
              👤 Employee
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input
                className="form-input"
                placeholder={role === 'admin' ? 'e.g. ADMIN-001' : 'e.g. EMP-001'}
                value={empId}
                onChange={e => setEmpId(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ background:'var(--c-crimson-light)', border:'1.5px solid #ef9a9a', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:'0.82rem', color:'var(--c-crimson)', marginBottom:16 }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%' }} disabled={loading}>
              {loading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}} /> Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: 14, background:'var(--c-bg)', borderRadius:'var(--radius-sm)', fontSize:'0.75rem', color:'var(--c-text-3)' }}>
            <strong style={{color:'var(--c-text-2)'}}>Demo Credentials:</strong><br />
            Admin: <code>ADMIN-001</code> / <code>admin123</code><br />
            Employee: <code>EMP-001</code> / <code>emp001</code>
          </div>
        </div>
      </div>
    </div>
  )
}
