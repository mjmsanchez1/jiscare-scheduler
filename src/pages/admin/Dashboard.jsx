import { useState, useEffect } from 'react'
import Topbar from '../../components/shared/Topbar'
import { MOCK_EMPLOYEES, MOCK_SHIFTS } from '../../utils/mockData'
import { formatDate, shiftBadgeClass, toISODate } from '../../utils/dateUtils'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const today = toISODate(new Date())
  const todayShifts = MOCK_SHIFTS.filter(s => s.Date === today)
  const conflictCount = 0 // would come from n8n checks log

  const stats = [
    { label: 'Total Employees', value: MOCK_EMPLOYEES.length, icon: '👥', color: 'teal' },
    { label: "Today's Shifts",  value: todayShifts.length,    icon: '📋', color: 'gold' },
    { label: 'Conflict Alerts', value: conflictCount,          icon: '⚠️', color: 'red'  },
    { label: 'Rest Days Today', value: todayShifts.filter(s => s.Shift_Type === 'OFF').length, icon: '☀️', color: 'green' },
  ]

  return (
    <>
      <Topbar title="Dashboard" subtitle="JISCare Scheduling Overview" />
      <div className="page-content animate-fade-up">
        <div className="page-header">
          <h1>Good morning! 👋</h1>
          <p>Here's what's happening at JISCare today — {formatDate(new Date(), { weekday:'long', month:'long', day:'numeric', year:'numeric' })}</p>
        </div>

        {/* Stats */}
        <div className="stat-grid">
          {stats.map((s, i) => (
            <div className="stat-card" key={i} style={{ animationDelay: `${i*0.08}s` }}>
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Today's Schedule */}
          <div className="card">
            <div className="card-header">
              <h2>📅 Today's Schedule</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/schedule')}>Create New</button>
            </div>
            <div className="table-wrap">
              {todayShifts.length === 0 ? (
                <div className="empty-state">
                  <div style={{fontSize:'2rem',marginBottom:8}}>📋</div>
                  <h3>No shifts scheduled today</h3>
                  <p>Go to Create Schedule to add shifts</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr><th>Employee</th><th>Shift</th><th>Time</th><th>Room</th></tr>
                  </thead>
                  <tbody>
                    {todayShifts.map((s, i) => {
                      const emp = MOCK_EMPLOYEES.find(e => e.Employee_ID === s.Employee_ID)
                      return (
                        <tr key={i}>
                          <td><strong>{emp?.Name || s.Employee_ID}</strong><br /><span style={{fontSize:'0.72rem',color:'var(--c-text-3)',fontFamily:'var(--font-mono)'}}>{s.Employee_ID}</span></td>
                          <td><span className={`badge ${shiftBadgeClass(s.Shift_Type)}`}>{s.Shift_Type}</span></td>
                          <td style={{fontSize:'0.82rem'}}>{s.Start_Time && s.End_Time ? `${s.Start_Time} – ${s.End_Time}` : '—'}</td>
                          <td style={{fontSize:'0.82rem'}}>{s.Room_ID || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Employees Quick View */}
          <div className="card">
            <div className="card-header">
              <h2>👥 Employees</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/employees')}>View All</button>
            </div>
            <div className="card-body" style={{padding:'12px 16px'}}>
              {MOCK_EMPLOYEES.map((e, i) => {
                const todayShift = todayShifts.find(s => s.Employee_ID === e.Employee_ID)
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 6px', borderBottom: i < MOCK_EMPLOYEES.length-1 ? '1px solid var(--c-border)':'none' }}>
                    <div className="emp-avatar" style={{width:36,height:36,fontSize:'0.85rem',borderRadius:10,margin:0}}>
                      {e.Name.split(' ').slice(0,2).map(n=>n[0]).join('')}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:'0.875rem'}}>{e.Name}</div>
                      <div style={{fontSize:'0.72rem',color:'var(--c-text-3)'}}>{e.Department} · {e.Position}</div>
                    </div>
                    {todayShift && (
                      <span className={`badge ${shiftBadgeClass(todayShift.Shift_Type)}`}>{todayShift.Shift_Type}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{marginTop:20}}>
          <div className="card-header"><h2>⚡ Quick Actions</h2></div>
          <div className="card-body" style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            {[
              { icon:'📅', label:'Create Schedule', to:'/admin/schedule' },
              { icon:'🤖', label:'Run AI Checker',  to:'/admin/checker' },
              { icon:'🗓️', label:'Day-Off Requests',to:'/admin/dayoff' },
              { icon:'👥', label:'All Employees',   to:'/admin/employees' },
            ].map((a,i) => (
              <button key={i} className="btn btn-secondary" onClick={() => navigate(a.to)}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
