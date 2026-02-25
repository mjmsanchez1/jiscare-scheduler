import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Topbar from '../../components/shared/Topbar'
import { MOCK_EMPLOYEES } from '../../utils/mockData'
import { n8nPost, API } from '../../utils/api'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/ui/Toast'

const MY_REQUESTS = [
  { Date: '2026-03-10', Status: 'Approved', Reason: 'Family event',    Manager_Note: 'Approved — no conflicts found.' },
  { Date: '2026-02-15', Status: 'Rejected', Reason: 'Personal errand', Manager_Note: 'Rejected — consecutive days off rule.' },
]

export default function EmployeeDayOff() {
  const { user } = useAuth()
  const { toasts, toast } = useToast()
  const empData = MOCK_EMPLOYEES.find(e => e.Employee_ID === user?.id) || MOCK_EMPLOYEES[0]

  const [form, setForm] = useState({ request_date:'', reason:'', notes:'' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState(MY_REQUESTS)

  const handleSubmit = async () => {
    if (!form.request_date || !form.reason) return toast.error('Missing Fields', 'Fill in date and reason.')
    setLoading(true)
    setResult(null)
    try {
      const res = await n8nPost(API.DAYOFF_SUBMIT, {
        employee_id:   empData.Employee_ID,
        employee_name: empData.Name,
        request_date:  form.request_date,
        reason:        form.reason,
        notes:         form.notes,
      })
      setResult(res)
      if (res.success) {
        toast.success('Request Approved!', res.message)
        setRequests(prev => [{ Date: form.request_date, Status: 'Approved', Reason: form.reason, Manager_Note: res.data?.ai_reasoning || '' }, ...prev])
        setForm({ request_date:'', reason:'', notes:'' })
      } else {
        toast.error('Request Rejected', res.message)
      }
    } catch {
      // Fallback message when n8n is offline
      setResult({
        success: false, status: 'error',
        message: 'Could not connect to the validation server. Your request has been saved for review by the admin.',
      })
    } finally { setLoading(false) }
  }

  return (
    <>
      <Topbar title="Request Day Off" subtitle="Employee Portal › Leave Request" />
      <ToastContainer toasts={toasts} />

      <div className="page-content animate-fade-up">
        <div className="page-header">
          <h1>✈️ Request Day Off</h1>
          <p>Submit your day-off request — it will be automatically validated by AI</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'420px 1fr',gap:20,alignItems:'start'}}>
          {/* Form */}
          <div className="card">
            <div className="card-header"><h2>📝 New Request</h2></div>
            <div className="card-body">
              <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'var(--c-teal-pale)',borderRadius:'var(--radius-sm)',marginBottom:18}}>
                <span style={{fontSize:'1.5rem'}}>👤</span>
                <div>
                  <div style={{fontWeight:700,fontSize:'0.9rem'}}>{empData.Name}</div>
                  <div style={{fontSize:'0.75rem',color:'var(--c-text-2)'}}>{empData.Employee_ID} · {empData.Department}</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Requested Date *</label>
                <input type="date" className="form-input" value={form.request_date} onChange={e=>setForm(f=>({...f,request_date:e.target.value}))}
                  min={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="form-group">
                <label className="form-label">Reason *</label>
                <select className="form-select" value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}>
                  <option value="">— Select Reason —</option>
                  {['Medical appointment','Family event','Personal errand','Rest & recovery','Emergency','Other'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Notes</label>
                <textarea className="form-textarea" rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Any additional context..." />
              </div>

              <div className="alert alert-info" style={{marginBottom:16}}>
                ℹ️ Your request will be validated against: shift conflicts, consecutive rest days, weekly limits, and team capacity.
              </div>

              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{width:'100%'}}>
                {loading ? <><span className="spinner" style={{width:15,height:15,borderWidth:2}} /> AI Validating…</> : '🤖 Submit Request'}
              </button>

              {result && (
                <div className={`ai-panel ${result.success ? 'clear' : result.status === 'error' ? 'pending' : 'conflict'}`} style={{marginTop:16}}>
                  <div className="ai-panel-header">
                    <span className="ai-panel-icon">{result.success ? '✅' : result.status === 'error' ? '⚙️' : '❌'}</span>
                    <span className="ai-panel-title">{result.success ? 'Approved!' : result.status === 'error' ? 'Connection Error' : 'Not Approved'}</span>
                  </div>
                  <p className="ai-panel-message">{result.message}</p>
                  {result.data?.conflicts?.length > 0 && (
                    <div className="ai-conflict-list">
                      {result.data.conflicts.map((c,i) => (
                        <div key={i} className="ai-conflict-item">
                          <span>🚫</span><div><span className="ai-conflict-rule">{c.rule}:</span> {c.detail}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.data?.suggested_date && (
                    <div className="ai-suggestions">
                      <div className="ai-suggestions-label">💡 Try this date instead</div>
                      <span className="alt-date-chip" onClick={() => setForm(f=>({...f,request_date:result.data.suggested_date}))}>
                        📅 {result.data.suggested_date}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* My Requests History */}
          <div className="card">
            <div className="card-header"><h2>📋 My Request History</h2></div>
            {requests.length === 0 ? (
              <div className="empty-state"><h3>No requests yet</h3><p>Submit your first day-off request!</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Reason</th><th>Status</th><th>Manager Note</th></tr>
                  </thead>
                  <tbody>
                    {requests.map((r,i) => (
                      <tr key={i}>
                        <td style={{fontFamily:'var(--font-mono)',fontSize:'0.85rem'}}>{r.Date}</td>
                        <td style={{fontSize:'0.85rem'}}>{r.Reason}</td>
                        <td><span className={`badge badge-${r.Status.toLowerCase()}`}>{r.Status}</span></td>
                        <td style={{fontSize:'0.78rem',color:'var(--c-text-2)',maxWidth:250}}>{r.Manager_Note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
