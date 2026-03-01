import { useState, useEffect } from 'react'
import Topbar from '../../components/shared/Topbar'
import { refreshEmployees, loadDayOffRequests, saveDayOffRequest, updateDayOffStatus } from '../../utils/mockData'
import { n8nPost, API } from '../../utils/api'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/ui/Toast'

export default function DayOffRequests() {
  const { toasts, toast } = useToast()
  const MOCK_EMPLOYEES = refreshEmployees()

  const [form, setForm]         = useState({ employee_id: '', request_date: '', reason: '', notes: '' })
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [requests, setRequests] = useState(() => loadDayOffRequests())
  const [filter, setFilter]     = useState('All')

  useEffect(() => {
    const onFocus = () => setRequests(loadDayOffRequests())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const handleSubmit = async () => {
    if (!form.employee_id || !form.request_date || !form.reason)
      return toast.error('Missing Fields', 'Fill in all required fields.')
    setLoading(true)
    setResult(null)
    const emp = MOCK_EMPLOYEES.find(e => e.Employee_ID === form.employee_id)

    const newRequest = {
      id:            `DO-${Date.now()}`,
      Employee_ID:   form.employee_id,
      Employee_Name: emp?.Name || '',
      Date:          form.request_date,
      Status:        'Pending',
      Reason:        form.reason,
      Notes:         form.notes,
      Requested_On:  new Date().toISOString().split('T')[0],
      Manager_Note:  '',
    }

    try {
      const res = await n8nPost(API.DAYOFF_SUBMIT, { ...form, employee_name: emp?.Name || '' })
      setResult(res)
      newRequest.Status       = res.success ? 'Approved' : 'Rejected'
      newRequest.Manager_Note = res.data?.ai_reasoning || res.message || ''
      saveDayOffRequest(newRequest)
      setRequests(loadDayOffRequests())
      if (res.success) {
        toast.success('Request Approved!', res.message)
        setForm({ employee_id:'', request_date:'', reason:'', notes:'' })
      } else {
        toast.error('Request Rejected', res.message)
      }
    } catch {
      saveDayOffRequest(newRequest)
      setRequests(loadDayOffRequests())
      toast.info('n8n Offline', 'Day-off request saved as Pending locally.')
      setForm({ employee_id:'', request_date:'', reason:'', notes:'' })
    } finally { setLoading(false) }
  }

  const handleStatusChange = (id, newStatus) => {
    const note = newStatus === 'Approved' ? 'Manually approved by admin.' : 'Manually rejected by admin.'
    updateDayOffStatus(id, newStatus, note)
    setRequests(loadDayOffRequests())
    toast.success('Status Updated', `Request marked as ${newStatus}.`)
  }

  const filtered = filter === 'All' ? requests : requests.filter(r => r.Status === filter)

  return (
    <>
      <Topbar title="Day-Off Requests" subtitle="Admin › Leave Management" />
      <ToastContainer toasts={toasts} />

      <div className="page-content animate-fade-up">
        <div className="page-header">
          <h1>🗓️ Day-Off Requests</h1>
          <p>Submit and manage employee day-off requests with AI validation</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'400px 1fr',gap:20,alignItems:'start'}}>
          <div className="card">
            <div className="card-header"><h2>➕ Submit Request</h2></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <select className="form-select" value={form.employee_id} onChange={e=>setForm(f=>({...f,employee_id:e.target.value}))}>
                  <option value="">— Select Employee —</option>
                  {MOCK_EMPLOYEES.map(e=><option key={e.Employee_ID} value={e.Employee_ID}>{e.Name} ({e.Employee_ID})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Requested Date *</label>
                <input type="date" className="form-input" value={form.request_date} onChange={e=>setForm(f=>({...f,request_date:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Reason *</label>
                <select className="form-select" value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}>
                  <option value="">— Select Reason —</option>
                  {['Medical appointment','Family event','Personal errand','Rest & recovery','Emergency','Other'].map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Additional Notes</label>
                <textarea className="form-textarea" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional details..." />
              </div>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{width:'100%'}}>
                {loading ? <><span className="spinner" style={{width:15,height:15,borderWidth:2}} /> AI is validating…</> : '🤖 Submit & AI-Validate'}
              </button>
              {result && (
                <div className={`ai-panel ${result.success ? 'clear' : 'conflict'}`} style={{marginTop:16}}>
                  <div className="ai-panel-header">
                    <span className="ai-panel-icon">{result.success ? '✅' : '❌'}</span>
                    <span className="ai-panel-title">{result.success ? 'Approved' : 'Rejected'}</span>
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
                      <div className="ai-suggestions-label">💡 Suggested Alternative</div>
                      <span className="alt-date-chip" onClick={() => setForm(f=>({...f,request_date:result.data.suggested_date}))}>
                        📅 {result.data.suggested_date}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>📋 All Requests</h2>
              <div style={{display:'flex',gap:6}}>
                <button className="btn btn-ghost btn-sm" onClick={() => setRequests(loadDayOffRequests())} title="Refresh">🔄</button>
                {['All','Pending','Approved','Rejected'].map(f => (
                  <button key={f} className={`btn btn-sm ${filter===f ? 'btn-primary':'btn-ghost'}`} onClick={()=>setFilter(f)}>{f}</button>
                ))}
              </div>
            </div>
            <div className="table-wrap">
              {filtered.length === 0 ? (
                <div className="empty-state"><h3>No {filter.toLowerCase()} requests</h3></div>
              ) : (
                <table>
                  <thead>
                    <tr><th>Employee</th><th>Date</th><th>Reason</th><th>Status</th><th>Manager Note</th><th>Submitted</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {[...filtered]
                      .sort((a,b) => (b.Requested_On || '').localeCompare(a.Requested_On || ''))
                      .map((r,i) => (
                        <tr key={i}>
                          <td>
                            <strong>{r.Employee_Name}</strong><br />
                            <span style={{fontSize:'0.72rem',fontFamily:'var(--font-mono)',color:'var(--c-text-3)'}}>{r.Employee_ID}</span>
                          </td>
                          <td style={{fontFamily:'var(--font-mono)',fontSize:'0.85rem'}}>{r.Date}</td>
                          <td style={{fontSize:'0.82rem'}}>{r.Reason}</td>
                          <td><span className={`badge badge-${r.Status?.toLowerCase()}`}>{r.Status}</span></td>
                          <td style={{fontSize:'0.78rem',color:'var(--c-text-2)',maxWidth:180}}>{r.Manager_Note || '—'}</td>
                          <td style={{fontSize:'0.75rem',color:'var(--c-text-3)'}}>{r.Requested_On}</td>
                          <td>
                            {r.Status === 'Pending' && (
                              <div style={{display:'flex',gap:4}}>
                                <button
                                  style={{background:'var(--c-teal)',color:'#fff',border:'none',padding:'3px 8px',borderRadius:6,cursor:'pointer',fontSize:'0.72rem'}}
                                  onClick={() => handleStatusChange(r.id, 'Approved')}
                                >✅ Approve</button>
                                <button
                                  style={{background:'#ef4444',color:'#fff',border:'none',padding:'3px 8px',borderRadius:6,cursor:'pointer',fontSize:'0.72rem'}}
                                  onClick={() => handleStatusChange(r.id, 'Rejected')}
                                >❌ Reject</button>
                              </div>
                            )}
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}