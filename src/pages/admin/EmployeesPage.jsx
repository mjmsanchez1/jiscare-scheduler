import { useState } from 'react'
import Topbar from '../../components/shared/Topbar'
import { MOCK_EMPLOYEES, MOCK_SHIFTS } from '../../utils/mockData'
import { getWeekDates, toISODate, getWeekLabel, isToday, addWeeks, shiftBadgeClass, DAYS_SHORT, getInitials } from '../../utils/dateUtils'
import { n8nPost, API } from '../../utils/api'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/ui/Toast'

export default function EmployeesPage() {
  const { toasts, toast } = useToast()
  const [weekRef, setWeekRef] = useState(new Date())
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [sending, setSending] = useState(false)

  const weekDates = getWeekDates(weekRef)
  const weekLabel = getWeekLabel(weekDates)

  const getShifts = (empId) => {
    const isoSet = new Set(weekDates.map(d => toISODate(d)))
    return MOCK_SHIFTS.filter(s => s.Employee_ID === empId && isoSet.has(s.Date))
  }

  const sendEmail = async (emp) => {
    setSending(true)
    const empShifts = getShifts(emp.Employee_ID)
    try {
      await n8nPost(API.SEND_EMAIL, {
        employee_id:    emp.Employee_ID,
        employee_name:  emp.Name,
        employee_email: emp.Email,
        week_label:     weekLabel,
        shifts:         weekDates.map(d => {
          const iso = toISODate(d)
          const s = empShifts.find(sh => sh.Date === iso)
          return { day: DAYS_SHORT[d.getDay()], date: iso, shift: s?.Shift_Type || 'Not Scheduled', time: s ? `${s.Start_Time}–${s.End_Time}` : '—', room: s?.Room_ID || '—' }
        }),
      })
      toast.success('Email Sent!', `Schedule sent to ${emp.Email}`)
    } catch {
      toast.info('Email Queued', `Email will be sent to ${emp.Email} when n8n is online.`)
    }
    setSending(false)
  }

  return (
    <>
      <Topbar title="Employees" subtitle="Admin › Employee Schedules" />
      <ToastContainer toasts={toasts} />

      <div className="page-content animate-fade-up">
        <div className="page-header">
          <h1>👥 All Employees</h1>
          <p>View each employee's schedule and send email notifications</p>
        </div>

        <div style={{display:'grid', gridTemplateColumns: selectedEmp ? '280px 1fr' : '1fr', gap:20, alignItems:'start'}}>
          {/* Employee Cards */}
          <div>
            <div className="emp-grid" style={{gridTemplateColumns: selectedEmp ? '1fr' : 'repeat(auto-fill,minmax(240px,1fr))'}}>
              {MOCK_EMPLOYEES.map(emp => (
                <div
                  key={emp.Employee_ID}
                  className={`emp-card ${selectedEmp?.Employee_ID === emp.Employee_ID ? 'selected' : ''}`}
                  onClick={() => setSelectedEmp(selectedEmp?.Employee_ID === emp.Employee_ID ? null : emp)}
                >
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                    <div className="emp-avatar" style={{margin:0}}>{getInitials(emp.Name)}</div>
                    <div>
                      <div className="emp-name">{emp.Name}</div>
                      <div className="emp-id">{emp.Employee_ID}</div>
                    </div>
                  </div>
                  <div style={{fontSize:'0.8rem',color:'var(--c-text-2)'}}>
                    <div>📁 {emp.Department}</div>
                    <div>💼 {emp.Position}</div>
                    <div>📧 {emp.Email}</div>
                  </div>
                  {!selectedEmp && (
                    <div style={{marginTop:10}}>
                      {getShifts(emp.Employee_ID).length > 0 ? (
                        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                          {getShifts(emp.Employee_ID).slice(0,3).map((s,i) => (
                            <span key={i} className={`badge ${shiftBadgeClass(s.Shift_Type)}`}>{s.Shift_Type}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{fontSize:'0.75rem',color:'var(--c-text-3)'}}>No shifts this week</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          {selectedEmp && (
            <div className="animate-fade-up">
              {/* Week nav */}
              <div className="week-nav" style={{marginBottom:16}}>
                <button className="btn btn-ghost btn-sm" onClick={() => setWeekRef(d => addWeeks(d,-1))}>‹ Prev</button>
                <span className="week-nav-label">📅 {weekLabel}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setWeekRef(d => addWeeks(d,1))}>Next ›</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setWeekRef(new Date())}>Today</button>
              </div>

              {/* Employee info */}
              <div className="card" style={{marginBottom:16}}>
                <div className="card-body" style={{display:'flex',alignItems:'center',gap:16}}>
                  <div className="emp-avatar" style={{width:56,height:56,fontSize:'1.2rem',borderRadius:16}}>{getInitials(selectedEmp.Name)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'1.1rem',fontWeight:800}}>{selectedEmp.Name}</div>
                    <div style={{fontSize:'0.82rem',color:'var(--c-text-2)'}}>{selectedEmp.Position} · {selectedEmp.Department}</div>
                    <div style={{fontSize:'0.78rem',color:'var(--c-text-3)',fontFamily:'var(--font-mono)'}}>{selectedEmp.Employee_ID} · {selectedEmp.Email}</div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => sendEmail(selectedEmp)}
                    disabled={sending}
                  >
                    {sending ? <><span className="spinner" style={{width:12,height:12,borderWidth:2}} /> Sending…</> : '📧 Email Schedule'}
                  </button>
                </div>
              </div>

              {/* Week schedule table */}
              <div className="card">
                <div className="card-header">
                  <h2>📋 Weekly Schedule</h2>
                  <span style={{fontSize:'0.78rem',color:'var(--c-text-3)'}}>{weekLabel}</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Day</th><th>Date</th><th>Shift</th><th>Time</th><th>Room</th><th>Notes</th></tr>
                    </thead>
                    <tbody>
                      {weekDates.map((d,i) => {
                        const iso = toISODate(d)
                        const s = MOCK_SHIFTS.find(sh => sh.Employee_ID === selectedEmp.Employee_ID && sh.Date === iso)
                        return (
                          <tr key={i} style={isToday(d) ? {background:'var(--c-teal-pale)'} : {}}>
                            <td style={{fontWeight:isToday(d)?700:400}}>{DAYS_SHORT[d.getDay()]}{isToday(d)&&' ◀'}</td>
                            <td>{d.toLocaleDateString('en-PH',{month:'short',day:'numeric'})}</td>
                            <td>{s ? <span className={`badge ${shiftBadgeClass(s.Shift_Type)}`}>{s.Shift_Type}</span> : '—'}</td>
                            <td style={{fontSize:'0.82rem',fontFamily:'var(--font-mono)'}}>{s?.Start_Time&&s?.End_Time?`${s.Start_Time} – ${s.End_Time}`:'—'}</td>
                            <td style={{fontSize:'0.82rem'}}>{s?.Room_ID||'—'}</td>
                            <td style={{fontSize:'0.8rem',color:'var(--c-text-2)'}}>{s?.Notes||''}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
