import { useState, useEffect } from 'react'
import Topbar from '../../components/shared/Topbar'
import { MOCK_EMPLOYEES, MOCK_ROOMS, MOCK_SHIFTS, addMockShift } from '../../utils/mockData'
import {
  getWeekDates, toISODate, getWeekLabel, isToday,
  addWeeks, shiftBadgeClass, shiftChipClass, DAYS_SHORT, getInitials
} from '../../utils/dateUtils'
import { n8nPost, API } from '../../utils/api'
import ToastContainer from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'

const SHIFT_TIMES = {
  Morning:   { start: '7:30 AM',  end: '12:30 PM' },
  Afternoon: { start: '12:30 PM', end: '5:30 PM'  },
  Night:     { start: '9:00 PM',  end: '6:00 AM'  },
  OFF:       { start: '',         end: ''          },
}

export default function CreateSchedule() {
  const { toasts, toast } = useToast()
  const [weekRef, setWeekRef] = useState(new Date())
  const [weekDates, setWeekDates] = useState([])
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [shifts, setShifts] = useState([...MOCK_SHIFTS])
  const [checkResult, setCheckResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: '', shift_type: 'Morning', room_id: 'ROOM-01', notes: '',
    start_time: '7:30 AM', end_time: '12:30 PM'
  })

  useEffect(() => { setWeekDates(getWeekDates(weekRef)) }, [weekRef])

  const getShift = (empId, date) => {
    const iso = toISODate(date)
    return shifts.find(s => s.Employee_ID === empId && s.Date === iso)
  }

  const openForm = (date) => {
    const iso = toISODate(date)
    const existing = selectedEmp ? getShift(selectedEmp.Employee_ID, date) : null
    setForm({
      date: iso,
      shift_type: existing?.Shift_Type || 'Morning',
      room_id:    existing?.Room_ID    || 'ROOM-01',
      notes:      existing?.Notes      || '',
      start_time: existing?.Start_Time || '7:30 AM',
      end_time:   existing?.End_Time   || '12:30 PM',
    })
    setCheckResult(null)
    setShowForm(true)
  }

  const handleShiftTypeChange = (type) => {
    const times = SHIFT_TIMES[type] || {}
    setForm(f => ({ ...f, shift_type: type, start_time: times.start, end_time: times.end }))
    setCheckResult(null)
  }

  const handleCheck = async () => {
    if (!selectedEmp) return toast.error('No Employee', 'Please select an employee first.')
    setChecking(true)
    setCheckResult(null)
    try {
      const payload = {
        employee_id: selectedEmp.Employee_ID,
        date:        form.date,
        shift_type:  form.shift_type,
        start_time:  form.start_time,
        end_time:    form.end_time,
        room_id:     form.shift_type === 'OFF' ? null : form.room_id,
        notes:       form.notes,
      }
      const res = await n8nPost(API.SCHEDULE_CHECK, payload)
      setCheckResult(res)
    } catch (err) {
      // Fallback: local conflict check (when n8n is not running)
      const localConflicts = []
      if (form.shift_type !== 'OFF') {
        const sameDay = shifts.filter(s =>
          s.Employee_ID === selectedEmp.Employee_ID &&
          s.Date === form.date && s.Shift_Type !== 'OFF'
        )
        if (sameDay.length > 0) {
          localConflicts.push({ rule: 'Employee Double-Booking', severity: 'Critical', detail: `${selectedEmp.Name} already has a shift on this date.` })
        }
        const roomSameDay = shifts.filter(s =>
          s.Room_ID === form.room_id && s.Date === form.date && s.Shift_Type !== 'OFF'
        )
        if (roomSameDay.length > 0 && form.shift_type !== 'OFF') {
          localConflicts.push({ rule: 'Room Double-Booking', severity: 'Critical', detail: `Room is already booked on this date.` })
        }
      } else {
        const dayBefore = new Date(form.date); dayBefore.setDate(dayBefore.getDate() - 1)
        const dayAfter  = new Date(form.date); dayAfter.setDate(dayAfter.getDate()  + 1)
        const b = toISODate(dayBefore), a = toISODate(dayAfter)
        const offB = shifts.find(s => s.Employee_ID === selectedEmp.Employee_ID && s.Date === b && s.Shift_Type === 'OFF')
        const offA = shifts.find(s => s.Employee_ID === selectedEmp.Employee_ID && s.Date === a && s.Shift_Type === 'OFF')
        if (offB) localConflicts.push({ rule: 'Consecutive Rest Days', severity: 'Critical', detail: `${selectedEmp.Name} already has a rest day on ${b}.` })
        else if (offA) localConflicts.push({ rule: 'Consecutive Rest Days', severity: 'Critical', detail: `${selectedEmp.Name} already has a rest day on ${a}.` })
      }
      setCheckResult({
        success: localConflicts.length === 0,
        status:  localConflicts.length === 0 ? 'clear' : 'conflict',
        message: localConflicts.length === 0
          ? `Schedule looks clear for ${selectedEmp.Name}! No conflicts found.`
          : `Conflicts detected for ${selectedEmp.Name}.`,
        data: { conflicts: localConflicts, alternatives: { rooms: [], dates: [] } }
      })
    } finally {
      setChecking(false)
    }
  }

  const handleSave = async () => {
    if (!selectedEmp) return toast.error('No Employee', 'Select an employee first.')
    setSaving(true)
    try {
      const newShift = {
        Employee_ID: selectedEmp.Employee_ID,
        Date:        form.date,
        Shift_Type:  form.shift_type,
        Start_Time:  form.start_time,
        End_Time:    form.end_time,
        Room_ID:     form.shift_type === 'OFF' ? '' : form.room_id,
        Notes:       form.notes,
      }

      // Try to post to n8n
      try {
        await n8nPost(API.CREATE_SHIFT, newShift)
      } catch { /* n8n offline — save locally */ }

      // Update local state
      setShifts(prev => {
        const filtered = prev.filter(s => !(s.Employee_ID === newShift.Employee_ID && s.Date === newShift.Date))
        return [...filtered, newShift]
      })
      addMockShift(newShift)
      setShowForm(false)
      setCheckResult(null)
      toast.success('Schedule Saved!', `${form.shift_type} shift saved for ${selectedEmp.Name} on ${form.date}.`)
    } catch (err) {
      toast.error('Save Failed', err.message)
    } finally {
      setSaving(false)
    }
  }

  const weekShifts = weekDates.length > 0 ? shifts.filter(s => {
    const isoSet = new Set(weekDates.map(d => toISODate(d)))
    return isoSet.has(s.Date)
  }) : []

  return (
    <>
      <Topbar title="Create Schedule" subtitle="Admin › Schedule Management" />
      <ToastContainer toasts={toasts} />

      <div className="page-content animate-fade-up">
        <div className="page-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
          <div>
            <h1>📅 Create Schedule</h1>
            <p>Select an employee, then click a day to assign their shift</p>
          </div>
        </div>

        <div className="schedule-container">
          {/* Employee List Panel */}
          <div className="emp-panel">
            <div className="card">
              <div className="card-header"><h2>👥 Employees</h2></div>
              <div style={{padding:'12px'}}>
                {MOCK_EMPLOYEES.map(emp => (
                  <div
                    key={emp.Employee_ID}
                    className={`emp-card ${selectedEmp?.Employee_ID === emp.Employee_ID ? 'selected' : ''}`}
                    style={{marginBottom:8,padding:'14px 16px'}}
                    onClick={() => { setSelectedEmp(emp); setShowForm(false); setCheckResult(null) }}
                  >
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div className="emp-avatar" style={{width:38,height:38,fontSize:'0.85rem',borderRadius:10,margin:0,flexShrink:0}}>
                        {getInitials(emp.Name)}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="emp-name" style={{fontSize:'0.875rem'}}>{emp.Name}</div>
                        <div className="emp-id">{emp.Employee_ID}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Calendar + Form */}
          <div>
            {/* Week Navigation */}
            <div className="week-nav">
              <button className="btn btn-ghost btn-sm" onClick={() => setWeekRef(d => addWeeks(d, -1))}>‹ Prev</button>
              <span className="week-nav-label">📅 {getWeekLabel(weekDates)}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setWeekRef(d => addWeeks(d, 1))}>Next ›</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setWeekRef(new Date())}>Today</button>
            </div>

            {/* Weekly Grid */}
            <div className="card" style={{marginBottom:20}}>
              <div className="card-header">
                <h2>{selectedEmp ? `📋 ${selectedEmp.Name}'s Week` : '📋 Weekly Overview — All Employees'}</h2>
                {selectedEmp && <span style={{fontSize:'0.78rem',color:'var(--c-text-3)'}}>Click any day to assign shift</span>}
              </div>
              <div className="card-body">
                <div className="week-grid">
                  {weekDates.map((date, i) => {
                    const iso = toISODate(date)
                    const dayShifts = selectedEmp
                      ? weekShifts.filter(s => s.Employee_ID === selectedEmp.Employee_ID && s.Date === iso)
                      : weekShifts.filter(s => s.Date === iso)

                    return (
                      <div key={i} className="week-day-col">
                        <div className={`week-day-header ${isToday(date) ? 'today' : ''}`}>
                          <div className="week-day-name">{DAYS_SHORT[date.getDay()]}</div>
                          <div className="week-day-date">{date.getDate()}</div>
                        </div>

                        {/* Shift chips */}
                        <div style={{display:'flex',flexDirection:'column',gap:4,minHeight:60}}>
                          {dayShifts.map((s, si) => {
                            const emp = MOCK_EMPLOYEES.find(e => e.Employee_ID === s.Employee_ID)
                            return (
                              <div
                                key={si}
                                className={`shift-chip ${shiftChipClass(s.Shift_Type)}`}
                                title={`${emp?.Name}: ${s.Shift_Type} ${s.Start_Time ? s.Start_Time+' – '+s.End_Time : ''}`}
                              >
                                <div className="chip-emp">{selectedEmp ? s.Shift_Type : (emp?.Name?.split(' ')[0] || s.Employee_ID)}</div>
                                <div className="chip-time">{s.Start_Time && s.End_Time ? `${s.Start_Time}–${s.End_Time}` : s.Shift_Type}</div>
                              </div>
                            )
                          })}

                          {/* Add button */}
                          {selectedEmp && (
                            <button
                              onClick={() => openForm(date)}
                              style={{
                                border:'1.5px dashed var(--c-border)', borderRadius:8,
                                background:'transparent', color:'var(--c-text-3)',
                                padding:'6px', cursor:'pointer', fontSize:'0.75rem',
                                transition:'all 0.15s'
                              }}
                              onMouseOver={e => { e.currentTarget.style.borderColor='var(--c-teal)'; e.currentTarget.style.color='var(--c-teal)' }}
                              onMouseOut={e => { e.currentTarget.style.borderColor='var(--c-border)'; e.currentTarget.style.color='var(--c-text-3)' }}
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {!selectedEmp && (
                  <div className="alert alert-info" style={{marginTop:16}}>
                    ℹ️ Select an employee on the left panel to assign shifts and see the "+ Add" button on each day.
                  </div>
                )}
              </div>
            </div>

            {/* Shift Assignment Form */}
            {showForm && selectedEmp && (
              <div className="card animate-fade-up">
                <div className="card-header">
                  <h2>✏️ Assign Shift — {selectedEmp.Name}</h2>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setCheckResult(null) }}>✕ Close</button>
                </div>
                <div className="card-body">
                  <div className="form-grid form-grid-2" style={{marginBottom:16}}>
                    <div className="form-group" style={{margin:0}}>
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={form.date}
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{margin:0}}>
                      <label className="form-label">Shift Type</label>
                      <select
                        className="form-select"
                        value={form.shift_type}
                        onChange={e => handleShiftTypeChange(e.target.value)}
                      >
                        <option value="Morning">🌅 Morning (7:30 AM – 12:30 PM)</option>
                        <option value="Afternoon">🌤 Afternoon (12:30 PM – 5:30 PM)</option>
                        <option value="Night">🌙 Night (9:00 PM – 6:00 AM)</option>
                        <option value="OFF">😴 Rest Day (OFF)</option>
                      </select>
                    </div>
                  </div>

                  {form.shift_type !== 'OFF' && (
                    <div className="form-grid form-grid-3" style={{marginBottom:16}}>
                      <div className="form-group" style={{margin:0}}>
                        <label className="form-label">Start Time</label>
                        <input className="form-input" value={form.start_time} onChange={e => setForm(f=>({...f,start_time:e.target.value}))} placeholder="7:30 AM" />
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label className="form-label">End Time</label>
                        <input className="form-input" value={form.end_time} onChange={e => setForm(f=>({...f,end_time:e.target.value}))} placeholder="12:30 PM" />
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label className="form-label">Room</label>
                        <select className="form-select" value={form.room_id} onChange={e => setForm(f=>({...f,room_id:e.target.value}))}>
                          {MOCK_ROOMS.map(r => <option key={r.Room_ID} value={r.Room_ID}>{r.Room_ID} — {r.Room_Name}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="form-group" style={{marginBottom:0}}>
                    <label className="form-label">Notes (Optional)</label>
                    <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} placeholder="Any special instructions..." />
                  </div>

                  {/* AI Check Result */}
                  {checkResult && (
                    <div className={`ai-panel ${checkResult.status === 'clear' ? 'clear' : 'conflict'}`}>
                      <div className="ai-panel-header">
                        <span className="ai-panel-icon">{checkResult.status === 'clear' ? '✅' : '⚠️'}</span>
                        <span className="ai-panel-title">{checkResult.status === 'clear' ? 'Schedule is Clear' : 'Conflict Detected'}</span>
                      </div>
                      <p className="ai-panel-message">{checkResult.message}</p>
                      {checkResult.data?.conflicts?.length > 0 && (
                        <div className="ai-conflict-list">
                          {checkResult.data.conflicts.map((c, i) => (
                            <div key={i} className="ai-conflict-item">
                              <span>🚫</span>
                              <div><span className="ai-conflict-rule">{c.rule}:</span> {c.detail}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {checkResult.data?.alternatives?.rooms?.length > 0 && (
                        <div className="ai-suggestions" style={{marginTop:10}}>
                          <div className="ai-suggestions-label">💡 Alternative Rooms</div>
                          {checkResult.data.alternatives.rooms.slice(0,3).map((r,i) => (
                            <span
                              key={i}
                              className="alt-date-chip"
                              onClick={() => setForm(f => ({ ...f, room_id: r.room_id }))}
                            >
                              🏠 {r.room_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{display:'flex',gap:10,marginTop:18}}>
                    <button className="btn btn-secondary" onClick={handleCheck} disabled={checking}>
                      {checking ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}} /> Checking…</> : '🤖 Check Conflicts (AI)'}
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={saving || (checkResult && checkResult.status === 'conflict')}
                    >
                      {saving ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}} /> Saving…</> : '💾 Save Schedule'}
                    </button>
                    {checkResult?.status === 'conflict' && (
                      <span style={{fontSize:'0.78rem',color:'var(--c-crimson)',alignSelf:'center'}}>⚠ Resolve conflicts before saving</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Employee's Full Week Schedule Preview (below form) */}
            {selectedEmp && (
              <div className="card" style={{marginTop:20}}>
                <div className="card-header">
                  <h2>📋 {selectedEmp.Name}'s Schedule This Week</h2>
                  <div style={{fontSize:'0.78rem',color:'var(--c-text-3)'}}>
                    {getWeekLabel(weekDates)}
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Day</th><th>Date</th><th>Shift</th><th>Time</th><th>Room</th><th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekDates.map((d, i) => {
                        const iso = toISODate(d)
                        const s = shifts.find(sh => sh.Employee_ID === selectedEmp.Employee_ID && sh.Date === iso)
                        return (
                          <tr key={i} style={isToday(d) ? {background:'var(--c-teal-pale)'} : {}}>
                            <td style={{fontWeight: isToday(d) ? 700 : 400}}>
                              {DAYS_SHORT[d.getDay()]}{isToday(d) && ' ◀ Today'}
                            </td>
                            <td>{d.toLocaleDateString('en-PH', {month:'short',day:'numeric'})}</td>
                            <td>{s ? <span className={`badge ${shiftBadgeClass(s.Shift_Type)}`}>{s.Shift_Type}</span> : <span style={{color:'var(--c-text-3)',fontSize:'0.8rem'}}>—</span>}</td>
                            <td style={{fontSize:'0.82rem',fontFamily:'var(--font-mono)'}}>{s?.Start_Time && s?.End_Time ? `${s.Start_Time} – ${s.End_Time}` : '—'}</td>
                            <td style={{fontSize:'0.82rem'}}>{s?.Room_ID || '—'}</td>
                            <td style={{fontSize:'0.8rem',color:'var(--c-text-2)'}}>{s?.Notes || ''}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
