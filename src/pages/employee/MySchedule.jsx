import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Topbar from '../../components/shared/Topbar'
import { refreshShifts, refreshEmployees } from '../../utils/mockData'
import {
  getWeekDates, toISODate, getWeekLabel, isToday,
  addWeeks, shiftBadgeClass, DAYS_SHORT, DAYS, formatDate
} from '../../utils/dateUtils'
import { exportSchedulePDF } from '../../utils/pdfExport'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/ui/Toast'

export default function MySchedule() {
  const { user } = useAuth()
  const { toasts, toast } = useToast()
  const [weekRef, setWeekRef]     = useState(new Date())
  const [weekDates, setWeekDates] = useState([])
  const [shifts, setShifts]       = useState(() => refreshShifts())

  useEffect(() => { setWeekDates(getWeekDates(weekRef)) }, [weekRef])
  // Reload from localStorage every time week changes
  useEffect(() => { setShifts(refreshShifts()) }, [weekRef])
  // Also reload on window focus (admin saved in another tab)
  useEffect(() => {
    const onFocus = () => setShifts(refreshShifts())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const weekLabel = getWeekLabel(weekDates)

  const employees = refreshEmployees()
  const empData   = employees.find(e => e.Employee_ID === user?.id) || {
    Employee_ID: user?.id       || '—',
    Name:        user?.name     || 'Unknown Employee',
    Department:  user?.dept     || '—',
    Position:    user?.position || '—',
    Email:       user?.email    || '—',
  }

  const getShift = (date) => {
    const iso = toISODate(date)
    return shifts.find(s => s.Employee_ID === empData.Employee_ID && s.Date === iso)
  }

  const handlePDFExport = () => {
    try {
      exportSchedulePDF({ employeeName: empData.Name, employeeId: empData.Employee_ID, weekDates, shifts, weekLabel })
      toast.success('PDF Downloaded!', 'Your schedule PDF has been saved.')
    } catch (e) { toast.error('Export Failed', e.message) }
  }

  const todayShift = weekDates.map(d => getShift(d)).find((s, i) => isToday(weekDates[i]))

  return (
    <>
      <Topbar title="My Schedule" subtitle="Employee Portal" />
      <ToastContainer toasts={toasts} />

      <div className="page-content animate-fade-up">
        <div className="page-header" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1>📅 My Schedule</h1>
            <p>Hello, <strong>{empData.Name}</strong> — {empData.Position} · {empData.Department}</p>
          </div>
          <button className="btn btn-primary" onClick={handlePDFExport}>📄 Download PDF</button>
        </div>

        {todayShift ? (
          <div style={{
            background: 'linear-gradient(135deg, var(--c-teal), var(--c-teal-dark))',
            borderRadius: 'var(--radius-lg)', padding: '24px 28px', color: '#fff',
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20,
            boxShadow: 'var(--shadow-lg)',
          }} className="animate-fade-up">
            <div style={{ fontSize:'2.5rem' }}>
              {todayShift.Shift_Type === 'Morning' ? '🌅' : todayShift.Shift_Type === 'Afternoon' ? '🌤' : todayShift.Shift_Type === 'Night' ? '🌙' : '😴'}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'0.75rem', opacity:0.7, textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700 }}>Today's Shift</div>
              <div style={{ fontSize:'1.5rem', fontWeight:800, lineHeight:1.2 }}>{todayShift.Shift_Type} Shift</div>
              <div style={{ opacity:0.85, marginTop:4, fontSize:'0.9rem' }}>
                {todayShift.Start_Time && todayShift.End_Time
                  ? `${todayShift.Start_Time} – ${todayShift.End_Time}  ·  ${todayShift.Room_ID || 'No room'}`
                  : 'Rest Day — Enjoy your day off! 🌿'}
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'0.78rem', opacity:0.7 }}>{formatDate(new Date(), { weekday:'long' })}</div>
              <div style={{ fontSize:'1.1rem', fontWeight:700 }}>{formatDate(new Date(), { month:'long', day:'numeric' })}</div>
            </div>
          </div>
        ) : (
          <div style={{
            background:'var(--c-bg)', border:'1.5px dashed var(--c-border)',
            borderRadius:'var(--radius-lg)', padding:'20px 28px',
            marginBottom:24, display:'flex', alignItems:'center', gap:16, color:'var(--c-text-3)',
          }}>
            <span style={{ fontSize:'1.8rem' }}>📋</span>
            <div>
              <div style={{ fontWeight:600, color:'var(--c-text-2)' }}>No shift scheduled for today</div>
              <div style={{ fontSize:'0.8rem', marginTop:2 }}>Your admin hasn't assigned a shift for today yet.</div>
            </div>
          </div>
        )}

        <div className="week-nav">
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekRef(d => addWeeks(d,-1))}>‹ Prev</button>
          <span className="week-nav-label">📅 {weekLabel}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekRef(d => addWeeks(d,1))}>Next ›</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setWeekRef(new Date())}>This Week</button>
        </div>

        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-header">
            <h2>📋 Weekly Schedule</h2>
            <span style={{ fontSize:'0.78rem', color:'var(--c-text-3)' }}>{weekLabel}</span>
          </div>
          <div className="card-body">
            <div className="week-grid">
              {weekDates.map((date, i) => {
                const shift = getShift(date)
                const today = isToday(date)
                return (
                  <div key={i} className="week-day-col">
                    <div className={`week-day-header ${today ? 'today':''}`}>
                      <div className="week-day-name">{DAYS_SHORT[date.getDay()]}</div>
                      <div className="week-day-date">{date.getDate()}</div>
                    </div>
                    <div style={{
                      minHeight: 90,
                      border: `1.5px solid ${today ? 'var(--c-teal)' : 'var(--c-border)'}`,
                      borderRadius: 'var(--radius-sm)', padding: 10,
                      background: today ? 'var(--c-teal-pale)' : 'var(--c-surface)',
                      display: 'flex', flexDirection: 'column', gap: 4, transition: 'all 0.2s',
                    }}>
                      {shift ? (
                        <>
                          <span className={`badge ${shiftBadgeClass(shift.Shift_Type)}`} style={{ alignSelf:'flex-start' }}>{shift.Shift_Type}</span>
                          {shift.Start_Time && shift.End_Time && (
                            <div style={{ fontSize:'0.72rem', fontFamily:'var(--font-mono)', color:'var(--c-text-2)', marginTop:4 }}>
                              {shift.Start_Time}<br />– {shift.End_Time}
                            </div>
                          )}
                          {shift.Room_ID && <div style={{ fontSize:'0.68rem', color:'var(--c-text-3)', marginTop:2 }}>🏠 {shift.Room_ID}</div>}
                        </>
                      ) : (
                        <div style={{ fontSize:'0.75rem', color:'var(--c-text-3)', textAlign:'center', margin:'auto' }}>
                          —<br /><span style={{ fontSize:'0.65rem' }}>Not scheduled</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>📋 Schedule Details</h2></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Day</th><th>Date</th><th>Shift</th><th>Start</th><th>End</th><th>Room</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {weekDates.map((d, i) => {
                  const s     = getShift(d)
                  const today = isToday(d)
                  return (
                    <tr key={i} style={today ? { background:'var(--c-teal-pale)', fontWeight:600 } : {}}>
                      <td>
                        {DAYS[d.getDay()]}
                        {today && <span style={{ marginLeft:6, background:'var(--c-teal)', color:'#fff', fontSize:'0.62rem', padding:'2px 7px', borderRadius:20, fontWeight:700 }}>TODAY</span>}
                      </td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.85rem' }}>{d.toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' })}</td>
                      <td>{s ? <span className={`badge ${shiftBadgeClass(s.Shift_Type)}`}>{s.Shift_Type}</span> : <span style={{ color:'var(--c-text-3)' }}>—</span>}</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem' }}>{s?.Start_Time || '—'}</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem' }}>{s?.End_Time   || '—'}</td>
                      <td style={{ fontSize:'0.82rem' }}>{s?.Room_ID || '—'}</td>
                      <td style={{ fontSize:'0.78rem', color:'var(--c-text-2)' }}>{s?.Notes || ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}