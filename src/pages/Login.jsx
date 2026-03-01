import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function EyeIcon({ open }) {
  return open ? (
    // Eye open
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    // Eye closed (slash)
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [empId, setEmpId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/employee/my-schedule'} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const result = login(empId.trim(), password)
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
          <p>Enter your credentials to access your portal</p>

          <div style={{
            background: 'linear-gradient(135deg, rgba(0,168,150,0.08), rgba(0,168,150,0.03))',
            border: '1px solid rgba(0,168,150,0.2)',
            borderRadius: 'var(--radius)',
            padding: '14px 16px',
            marginBottom: 24,
            fontSize: '0.82rem',
            color: 'var(--c-text-2)',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start'
          }}>
            <span style={{fontSize:'1.1rem', marginTop:1}}>💡</span>
            <div>
              <strong style={{color:'var(--c-text-1)'}}>Smart Login</strong> — your role is detected automatically from your credentials.
              No need to select Admin or Employee.
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input
                className="form-input"
                placeholder="e.g. ADMIN-001 or EMP-001"
                value={empId}
                onChange={e => setEmpId(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: showPassword ? 'var(--c-primary, #00a896)' : 'var(--c-text-3, #9ca3af)',
                    transition: 'color 0.2s ease',
                    lineHeight: 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--c-primary, #00a896)'}
                  onMouseLeave={e => e.currentTarget.style.color = showPassword ? 'var(--c-primary, #00a896)' : 'var(--c-text-3, #9ca3af)'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
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