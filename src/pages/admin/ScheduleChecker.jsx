import { useState } from 'react'
import Topbar from '../../components/shared/Topbar'
import { MOCK_EMPLOYEES, MOCK_ROOMS } from '../../utils/mockData'
import { n8nPost, API } from '../../utils/api'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/ui/Toast'

export default function ScheduleChecker() {
  const { toasts, toast } = useToast()
  const [form, setForm] = useState({
    employee_id: '', date: '', shift_type: 'Morning',
    start_time: '7:30 AM', end_time: '12:30 PM', room_id: 'ROOM-01', notes: ''
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  const SHIFT_DEFAULTS = {
    Morning:   { start: '7:30 AM',  end: '12:30 PM' },
    Afternoon: { start: '12:30 PM', end: '5:30 PM'  },
    Night:     { start: '9:00 PM',  end: '6:00 AM'  },
    OFF:       { start: '',         end: ''          },
  }

  const handleCheck = async () => {
    if (!form.employee_id || !form.date) return toast.error('Missing Fields', 'Select employee and date.')
    setLoading(true)
    setResult(null)
    try {
      const res = await n8nPost(API.SCHEDULE_CHECK, {
        employee_id: form.employee_id,
        date:        form.date,
        shift_type:  form.shift_type,
        start_time:  form.start_time,
        end_time:    form.end_time,
        room_id:     form.shift_type === 'OFF' ? null : form.room_id,
        notes:       form.notes,
      })
      setResult(res)
      setHistory(prev => [{ ...form, result: res, ts: new Date().toLocaleTimeString('en-PH') }, ...prev.slice(0, 9)])
    } catch (err) {
      setResult({
        success: false, status: 'error',
        message: `Could not reach n8n (${err.message}). Make sure your n8n instance is running and the schedule-check webhook is active.`,
        data: { conflicts: [], alternatives: { rooms: [], dates: [] } }
      })
    } finally { setLoading(false) }
  }

  return (
    <>
      <Topbar title="AI Conflict Checker" subtitle="Admin › Schedule Validation" />
      <ToastContainer toasts={toasts} />

      <div className="page-content animate-fade-up">
        <div className="page-header">
          <h1>🤖 AI Schedule Checker</h1>
          <p>Validate a schedule entry against all rules using your n8n AI workflow</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}}>
          {/* Checker Form */}
          <div className="card">
            <div className="card-header"><h2>🔍 Check Schedule</h2></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select className="form-select" value={form.employee_id} onChange={e => setForm(f=>({...f,employee_id:e.target.value}))}>
                  <option value="">— Select Employee —</option>
                  {MOCK_EMPLOYEES.map(e => <option key={e.Employee_ID} value={e.Employee_ID}>{e.Name} ({e.Employee_ID})</option>)}
                </select>
              </div>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Shift Type</label>
                  <select className="form-select" value={form.shift_type} onChange={e => {
                    const d = SHIFT_DEFAULTS[e.target.value]||{}
                    setForm(f=>({...f,shift_type:e.target.value,start_time:d.start||'',end_time:d.end||''}))
                  }}>
                    <option value="Morning">🌅 Morning</option>
                    <option value="Afternoon">🌤 Afternoon</option>
                    <option value="Night">🌙 Night</option>
                    <option value="OFF">😴 Rest Day</option>
                  </select>
                </div>
              </div>

              {form.shift_type !== 'OFF' && (
                <div className="form-grid form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input className="form-input" value={form.start_time} onChange={e=>setForm(f=>({...f,start_time:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input className="form-input" value={form.end_time} onChange={e=>setForm(f=>({...f,end_time:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Room</label>
                    <select className="form-select" value={form.room_id} onChange={e=>setForm(f=>({...f,room_id:e.target.value}))}>
                      {MOCK_ROOMS.map(r => <option key={r.Room_ID} value={r.Room_ID}>{r.Room_ID}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional..." />
              </div>

              <button className="btn btn-primary" onClick={handleCheck} disabled={loading} style={{width:'100%'}}>
                {loading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}} /> Running AI Check…</> : '🤖 Run AI Conflict Check'}
              </button>

              {/* Result */}
              {result && (
                <div className={`ai-panel ${result.status === 'clear' ? 'clear' : result.status === 'error' ? 'pending' : 'conflict'}`} style={{marginTop:16}}>
                  <div className="ai-panel-header">
                    <span className="ai-panel-icon">
                      {result.status === 'clear' ? '✅' : result.status === 'error' ? '⚙️' : '⚠️'}
                    </span>
                    <span className="ai-panel-title">
                      {result.status === 'clear' ? 'All Clear!' : result.status === 'error' ? 'Connection Error' : 'Conflict Detected'}
                    </span>
                  </div>
                  <p className="ai-panel-message">{result.message}</p>

                  {result.data?.conflicts?.length > 0 && (
                    <div className="ai-conflict-list">
                      {result.data.conflicts.map((c,i) => (
                        <div key={i} className="ai-conflict-item">
                          <span>🚫</span>
                          <div><span className="ai-conflict-rule">{c.rule}:</span> {c.detail}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.data?.alternatives?.rooms?.length > 0 && (
                    <div className="ai-suggestions">
                      <div className="ai-suggestions-label">Alternative Rooms</div>
                      {result.data.alternatives.rooms.map((r,i) => (
                        <span key={i} className="alt-date-chip" onClick={() => setForm(f=>({...f,room_id:r.room_id}))}>
                          🏠 {r.room_name}
                        </span>
                      ))}
                    </div>
                  )}

                  {result.data?.alternatives?.dates?.length > 0 && (
                    <div className="ai-suggestions" style={{marginTop:8}}>
                      <div className="ai-suggestions-label">Alternative Dates</div>
                      {result.data.alternatives.dates.map((d,i) => (
                        <span key={i} className="alt-date-chip" onClick={() => setForm(f=>({...f,date:d.date}))}>
                          📅 {d.date} ({d.weekday})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Rules Reference + History */}
          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            <div className="card">
              <div className="card-header"><h2>📋 Validation Rules</h2></div>
              <div className="card-body" style={{padding:'16px 20px'}}>
                {[
                  { icon:'🚫', rule:'Employee Double-Booking', desc:'No employee can have overlapping shifts on the same day' },
                  { icon:'🏠', rule:'Room Double-Booking',     desc:'No room can be used by two employees at the same time' },
                  { icon:'😴', rule:'Consecutive Rest Days',   desc:'No employee should have two or more consecutive rest days' },
                  { icon:'📅', rule:'Weekly Limit (Day-Off)',  desc:'Maximum 1 approved day-off per week per employee' },
                  { icon:'🔁', rule:'Same Weekday Repeat',     desc:'Employees should not take off on the same weekday repeatedly' },
                  { icon:'👥', rule:'Max Capacity (Day-Off)',  desc:'Maximum 2 employees off on any given day' },
                ].map((r,i) => (
                  <div key={i} style={{display:'flex',gap:10,padding:'9px 0',borderBottom:i<5?'1px solid var(--c-border)':'none'}}>
                    <span style={{fontSize:'1rem',flexShrink:0}}>{r.icon}</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:'0.82rem'}}>{r.rule}</div>
                      <div style={{fontSize:'0.75rem',color:'var(--c-text-2)',marginTop:2}}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {history.length > 0 && (
              <div className="card">
                <div className="card-header"><h2>🕒 Recent Checks</h2></div>
                <div style={{maxHeight:280,overflowY:'auto'}}>
                  {history.map((h,i) => {
                    const emp = MOCK_EMPLOYEES.find(e=>e.Employee_ID===h.employee_id)
                    return (
                      <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:'1px solid var(--c-border)'}}>
                        <span>{h.result?.status==='clear'?'✅':'⚠️'}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'0.82rem',fontWeight:600}}>{emp?.Name || h.employee_id}</div>
                          <div style={{fontSize:'0.72rem',color:'var(--c-text-3)'}}>{h.date} · {h.shift_type}</div>
                        </div>
                        <span className={`badge ${h.result?.status==='clear'?'badge-clear':'badge-conflict'}`}>{h.result?.status}</span>
                        <span style={{fontSize:'0.68rem',color:'var(--c-text-3)'}}>{h.ts}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
