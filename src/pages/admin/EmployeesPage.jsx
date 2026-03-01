import { useState, useEffect } from 'react'
import Topbar from '../../components/shared/Topbar'
import {
  MOCK_SHIFTS,
  refreshEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  getNextEmployeeId,
  saveAuthEntry,
  deleteAuthEntry,
  loadAuthDB,
} from '../../utils/mockData'
import { getWeekDates, toISODate, getWeekLabel, isToday, addWeeks, shiftBadgeClass, DAYS_SHORT, getInitials } from '../../utils/dateUtils'
import { n8nPost, API } from '../../utils/api'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/ui/Toast'

// ── Department / Position options ────────────────────────────
const DEPARTMENTS = ['Nursing', 'Therapy', 'Admin', 'Radiology', 'Laboratory', 'Pharmacy', 'Emergency', 'Surgery', 'ICU', 'Other']
const POSITIONS_BY_DEPT = {
  Nursing:    ['Senior Nurse', 'Staff Nurse', 'Charge Nurse', 'Head Nurse', 'Nursing Aide'],
  Therapy:    ['Physiotherapist', 'Occupational Therapist', 'Speech Therapist', 'Respiratory Therapist'],
  Admin:      ['Care Coordinator', 'Medical Secretary', 'Administrative Officer', 'Receptionist'],
  Radiology:  ['Radiologic Technologist', 'Radiologist', 'MRI Technologist'],
  Laboratory: ['Medical Technologist', 'Lab Aide', 'Phlebotomist'],
  Pharmacy:   ['Pharmacist', 'Pharmacy Technician', 'Pharmacy Aide'],
  Emergency:  ['Emergency Nurse', 'Trauma Nurse', 'ER Technician'],
  Surgery:    ['Surgical Nurse', 'Scrub Nurse', 'OR Technician'],
  ICU:        ['ICU Nurse', 'Critical Care Nurse', 'ICU Technician'],
  Other:      ['Staff', 'Specialist', 'Consultant'],
}

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contractual', 'Per Diem', 'Probationary']
const CIVIL_STATUS     = ['Single', 'Married', 'Widowed', 'Separated']
const BLOOD_TYPES      = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const EMPTY_FORM = {
  name: '', department: 'Nursing', position: 'Senior Nurse',
  email: '', phone: '', employment_type: 'Full-time',
  date_hired: '', license_no: '',
  address: '', emergency_contact: '', blood_type: 'O+', civil_status: 'Single',
  password: '', confirm_password: '',
}

// ── Password strength helpers ────────────────────────────────
const PWD_RULES = [
  { id: 'length',  label: 'At least 12 characters',              test: p => p.length >= 12 },
  { id: 'upper',   label: 'Uppercase letter (A–Z)',               test: p => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'Lowercase letter (a–z)',               test: p => /[a-z]/.test(p) },
  { id: 'number',  label: 'Number (0–9)',                         test: p => /[0-9]/.test(p) },
  { id: 'symbol',  label: 'Symbol (!@#$%^&* …)',                  test: p => /[^A-Za-z0-9]/.test(p) },
  { id: 'norepeat',label: 'No 3 identical characters in a row',   test: p => !/(.)\1\1/.test(p) },
]

function getStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: 'transparent' }
  const passed = PWD_RULES.filter(r => r.test(pwd)).length
  if (passed <= 2) return { score: 1, label: 'Weak',   color: '#ef4444' }
  if (passed <= 4) return { score: 2, label: 'Fair',   color: '#f59e0b' }
  if (passed === 5) return { score: 3, label: 'Good',  color: '#3b82f6' }
  return             { score: 4, label: 'Strong', color: '#10b981' }
}

function generateStrongPassword() {
  const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower   = 'abcdefghjkmnpqrstuvwxyz'
  const numbers = '23456789'
  const symbols = '!@#$%^&*-_=+'
  const all     = upper + lower + numbers + symbols
  const rand    = (str) => str[Math.floor(Math.random() * str.length)]
  // Guarantee at least one from each group
  let pwd = rand(upper) + rand(lower) + rand(numbers) + rand(symbols) + rand(numbers) + rand(symbols)
  for (let i = pwd.length; i < 16; i++) pwd += rand(all)
  // Shuffle
  return pwd.split('').sort(() => Math.random() - 0.5).join('')
}

// ── Password field component ──────────────────────────────────
function PasswordField({ label, value, onChange, error, placeholder, showStrength = false, showRules = false }) {
  const [show, setShow] = useState(false)
  const strength = getStrength(value)

  return (
    <div className="form-group" style={{ margin: '0 0 14px' }}>
      <label className="form-label">
        {label} <span style={{ color: 'var(--c-crimson)' }}>*</span>
      </label>

      {/* Input + show/hide toggle */}
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          className="form-input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            paddingRight: 44,
            borderColor: error ? 'var(--c-crimson)' : value && showStrength ? strength.color : undefined,
            transition: 'border-color 0.2s',
          }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
            color: 'var(--c-text-3)', padding: 4, lineHeight: 1,
          }}
          title={show ? 'Hide password' : 'Show password'}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>

      {/* Strength bar (only on the main password field) */}
      {showStrength && value && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
            {[1,2,3,4].map(n => (
              <div key={n} style={{
                flex: 1, height: 4, borderRadius: 99,
                background: n <= strength.score ? strength.color : 'var(--c-border)',
                transition: 'background 0.3s',
              }} />
            ))}
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: strength.color, marginLeft: 6, whiteSpace: 'nowrap' }}>
              {strength.label}
            </span>
          </div>

          {/* Rule checklist */}
          {showRules && (
            <div style={{
              background: 'var(--c-bg)', borderRadius: 'var(--radius-sm)',
              padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px',
            }}>
              {PWD_RULES.map(rule => {
                const ok = rule.test(value)
                return (
                  <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem' }}>
                    <span style={{ color: ok ? '#10b981' : 'var(--c-text-3)', fontSize: '0.8rem', flexShrink: 0 }}>
                      {ok ? '✅' : '○'}
                    </span>
                    <span style={{ color: ok ? 'var(--c-text-1)' : 'var(--c-text-3)', transition: 'color 0.2s' }}>
                      {rule.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {error && <div style={{ color: 'var(--c-crimson)', fontSize: '0.74rem', marginTop: 4 }}>{error}</div>}
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────
function EmployeeModal({ mode, employee, onClose, onSaved, toast }) {
  const [form, setForm] = useState(() => {
    if (mode === 'edit' && employee) {
      const db = loadAuthDB()
      const auth = db.find(u => u.id === employee.Employee_ID)
      return {
        name:              employee.Name             || '',
        department:        employee.Department       || 'Nursing',
        position:          employee.Position         || '',
        email:             employee.Email            || '',
        phone:             employee.Phone            || '',
        employment_type:   employee.Employment_Type  || 'Full-time',
        date_hired:        employee.Date_Hired       || '',
        license_no:        employee.License_No       || '',
        address:           employee.Address          || '',
        emergency_contact: employee.Emergency_Contact|| '',
        blood_type:        employee.Blood_Type       || 'O+',
        civil_status:      employee.Civil_Status     || 'Single',
        password:          auth?.password            || '',
        confirm_password:  auth?.password            || '',
      }
    }
    return { ...EMPTY_FORM }
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [generatedHint, setGeneratedHint] = useState('')

  const positions = POSITIONS_BY_DEPT[form.department] || POSITIONS_BY_DEPT.Other
  const setDept = (dept) => {
    const pos = (POSITIONS_BY_DEPT[dept] || POSITIONS_BY_DEPT.Other)[0]
    setForm(f => ({ ...f, department: dept, position: pos }))
  }

  const handleGeneratePassword = () => {
    const pwd = generateStrongPassword()
    setForm(f => ({ ...f, password: pwd, confirm_password: pwd }))
    setErrors(e => ({ ...e, password: undefined, confirm_password: undefined }))
    setGeneratedHint(pwd)
    setTimeout(() => setGeneratedHint(''), 8000) // auto-hide after 8s
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format'
    if (!form.password)     e.password = 'Password is required'

    // Strong password rules
    const failedRules = PWD_RULES.filter(r => !r.test(form.password))
    if (failedRules.length > 0) {
      e.password = `Password must meet all security requirements (${failedRules.length} not met)`
    }
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)

    if (mode === 'add') {
      const newId = getNextEmployeeId()
      const newEmp = {
        Employee_ID:       newId,
        Name:              form.name.trim(),
        Department:        form.department,
        Position:          form.position,
        Email:             form.email.trim(),
        Phone:             form.phone.trim(),
        Employment_Type:   form.employment_type,
        Date_Hired:        form.date_hired,
        License_No:        form.license_no.trim(),
        Address:           form.address.trim(),
        Emergency_Contact: form.emergency_contact.trim(),
        Blood_Type:        form.blood_type,
        Civil_Status:      form.civil_status,
      }
      addEmployee(newEmp)
      saveAuthEntry({ id: newId, password: form.password, role: 'employee' })
      toast.success('Employee Added!', `${newEmp.Name} (${newId}) has been added to the database.`)
    } else {
      const updates = {
        Name:              form.name.trim(),
        Department:        form.department,
        Position:          form.position,
        Email:             form.email.trim(),
        Phone:             form.phone.trim(),
        Employment_Type:   form.employment_type,
        Date_Hired:        form.date_hired,
        License_No:        form.license_no.trim(),
        Address:           form.address.trim(),
        Emergency_Contact: form.emergency_contact.trim(),
        Blood_Type:        form.blood_type,
        Civil_Status:      form.civil_status,
      }
      updateEmployee(employee.Employee_ID, updates)
      saveAuthEntry({ id: employee.Employee_ID, password: form.password, role: 'employee' })
      toast.success('Employee Updated!', `${form.name.trim()} has been updated.`)
    }

    setSaving(false)
    onSaved()
  }

  const f = (field, label, type = 'text', required = false) => (
    <div className="form-group" style={{ margin: '0 0 14px' }}>
      <label className="form-label">{label}{required && <span style={{ color: 'var(--c-crimson)', marginLeft: 3 }}>*</span>}</label>
      <input
        type={type}
        className="form-input"
        value={form[field]}
        onChange={e => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: undefined })) }}
        style={errors[field] ? { borderColor: 'var(--c-crimson)' } : {}}
      />
      {errors[field] && <div style={{ color: 'var(--c-crimson)', fontSize: '0.74rem', marginTop: 3 }}>{errors[field]}</div>}
    </div>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--c-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 760,
        maxHeight: '92vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)',
        animation: 'fadeUp 0.2s ease',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', borderBottom: '1px solid var(--c-border)',
          position: 'sticky', top: 0, background: 'var(--c-surface)', zIndex: 10,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
              {mode === 'add' ? '➕ Add New Employee' : '✏️ Edit Employee'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--c-text-3)' }}>
              {mode === 'add' ? 'Fill in all required fields. Credentials will be saved to the database.' : `Editing: ${employee?.Name} (${employee?.Employee_ID})`}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Cancel</button>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Section: Personal Info */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-teal)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              👤 Personal Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              {f('name', 'Full Name', 'text', true)}
              {f('email', 'Email Address', 'email', true)}
              {f('phone', 'Phone Number', 'tel')}
              <div className="form-group" style={{ margin: '0 0 14px' }}>
                <label className="form-label">Civil Status</label>
                <select className="form-select" value={form.civil_status} onChange={e => setForm(p => ({ ...p, civil_status: e.target.value }))}>
                  {CIVIL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: '0 0 14px' }}>
                <label className="form-label">Blood Type</label>
                <select className="form-select" value={form.blood_type} onChange={e => setForm(p => ({ ...p, blood_type: e.target.value }))}>
                  {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              {f('address', 'Home Address')}
              {f('emergency_contact', 'Emergency Contact')}
            </div>
          </div>

          {/* Section: Employment Info */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-teal)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, paddingTop: 10, borderTop: '1px solid var(--c-border)' }}>
              💼 Employment Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              <div className="form-group" style={{ margin: '0 0 14px' }}>
                <label className="form-label">Department <span style={{ color: 'var(--c-crimson)' }}>*</span></label>
                <select className="form-select" value={form.department} onChange={e => setDept(e.target.value)}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: '0 0 14px' }}>
                <label className="form-label">Position <span style={{ color: 'var(--c-crimson)' }}>*</span></label>
                <select className="form-select" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))}>
                  {positions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: '0 0 14px' }}>
                <label className="form-label">Employment Type</label>
                <select className="form-select" value={form.employment_type} onChange={e => setForm(p => ({ ...p, employment_type: e.target.value }))}>
                  {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {f('date_hired', 'Date Hired', 'date')}
              {f('license_no', 'License / PRC No.')}
            </div>
          </div>

          {/* ── Section: Login Credentials ── */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-teal)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, paddingTop: 10, borderTop: '1px solid var(--c-border)' }}>
              🔐 Login Credentials
            </div>

            {/* Info banner */}
            <div style={{ background: 'var(--c-teal-pale)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: '0.8rem', color: 'var(--c-text-2)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0 }}>ℹ️</span>
              <div>
                {mode === 'add'
                  ? <>The Employee ID will be auto-generated (e.g. <strong>{getNextEmployeeId()}</strong>). The employee logs in with their <strong>Employee ID + password</strong>.</>
                  : <>Updating the password will take effect on the employee's next login.</>}
              </div>
            </div>

            {/* Generate password button + hint */}
            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleGeneratePassword}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                ✨ Generate Strong Password
              </button>
              {generatedHint && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', background: '#f0fdf4',
                  border: '1px solid #86efac', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem', color: '#166534', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                }}>
                  <span>🔑</span>
                  <span>Generated: <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.04em', background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>{generatedHint}</code></span>
                  <span style={{ color: '#16a34a', fontSize: '0.7rem', marginLeft: 4 }}>⚠ Copy and share securely — this disappears soon</span>
                </div>
              )}
            </div>

            {/* Password fields side-by-side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px', alignItems: 'start' }}>

              {/* Left: main password + strength meter + rules */}
              <div className="form-group" style={{ margin: '0 0 14px' }}>
                <label className="form-label">Password <span style={{ color: 'var(--c-crimson)' }}>*</span></label>
                <PwdInput
                  value={form.password}
                  onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: undefined })) }}
                  placeholder="Min. 12 characters"
                  borderColor={
                    errors.password ? 'var(--c-crimson)'
                    : form.password ? getStrength(form.password).color
                    : undefined
                  }
                />
                {/* Strength bar */}
                {form.password && (() => {
                  const s = getStrength(form.password)
                  return (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 6 }}>
                        {[1,2,3,4].map(n => (
                          <div key={n} style={{
                            flex: 1, height: 4, borderRadius: 99,
                            background: n <= s.score ? s.color : 'var(--c-border)',
                            transition: 'background 0.3s',
                          }} />
                        ))}
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: s.color, marginLeft: 6, minWidth: 44 }}>{s.label}</span>
                      </div>
                      {/* Checklist */}
                      <div style={{ background: 'var(--c-bg)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px' }}>
                        {PWD_RULES.map(rule => {
                          const ok = rule.test(form.password)
                          return (
                            <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.71rem' }}>
                              <span style={{ fontSize: '0.75rem', color: ok ? '#10b981' : 'var(--c-text-3)', flexShrink: 0, transition: 'color 0.2s' }}>
                                {ok ? '✅' : '○'}
                              </span>
                              <span style={{ color: ok ? 'var(--c-text-1)' : 'var(--c-text-3)', transition: 'color 0.2s' }}>
                                {rule.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
                {errors.password && <div style={{ color: 'var(--c-crimson)', fontSize: '0.74rem', marginTop: 4 }}>{errors.password}</div>}
              </div>

              {/* Right: confirm password */}
              <div className="form-group" style={{ margin: '0 0 14px' }}>
                <label className="form-label">Confirm Password <span style={{ color: 'var(--c-crimson)' }}>*</span></label>
                <ConfirmPwdInput
                  password={form.password}
                  value={form.confirm_password}
                  onChange={e => { setForm(p => ({ ...p, confirm_password: e.target.value })); setErrors(p => ({ ...p, confirm_password: undefined })) }}
                  error={errors.confirm_password}
                />
              </div>
            </div>

            {/* Security policy notice */}
            <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--c-text-2)' }}>
              <span style={{ flexShrink: 0 }}>🛡️</span>
              <span>JISCare requires <strong>strong, unique passwords</strong> — at least 12 characters mixing uppercase, lowercase, numbers, and symbols. Never share or reuse passwords from other accounts.</span>
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div style={{
          display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 28px', borderTop: '1px solid var(--c-border)',
          position: 'sticky', bottom: 0, background: 'var(--c-surface)',
        }}>
          {/* Live strength summary */}
          {form.password ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--c-text-3)' }}>Strength:</span>
              <span style={{ fontWeight: 700, color: getStrength(form.password).color }}>
                {getStrength(form.password).label}
              </span>
              {getStrength(form.password).score < 4 && (
                <span style={{ color: 'var(--c-text-3)' }}>· meet all 6 requirements to save</span>
              )}
            </div>
          ) : <span />}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || Boolean(form.password && getStrength(form.password).score < 4)}
              title={form.password && getStrength(form.password).score < 4 ? 'Password must be Strong to save' : ''}
            >
              {saving
                ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</>
                : mode === 'add' ? '✅ Add Employee' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Reusable password input with show/hide toggle ─────────────
function PwdInput({ value, onChange, placeholder, borderColor }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        className="form-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ paddingRight: 44, borderColor, transition: 'border-color 0.25s' }}
      />
      <button type="button" onClick={() => setShow(s => !s)} style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
        color: 'var(--c-text-3)', padding: 4, lineHeight: 1,
      }} title={show ? 'Hide' : 'Show'}>
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  )
}

// ── Confirm password input with match icon + show/hide ────────
function ConfirmPwdInput({ password, value, onChange, error }) {
  const [show, setShow] = useState(false)
  const matches = value.length > 0 && password === value
  const noMatch = value.length > 0 && password !== value
  return (
    <>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          className="form-input"
          value={value}
          onChange={onChange}
          placeholder="Re-enter password"
          style={{
            paddingRight: 68,
            borderColor: error ? 'var(--c-crimson)' : matches ? '#10b981' : noMatch ? '#ef4444' : undefined,
            transition: 'border-color 0.25s',
          }}
        />
        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2, alignItems: 'center' }}>
          {matches && <span style={{ fontSize: '0.9rem' }}>✅</span>}
          {noMatch && <span style={{ fontSize: '0.9rem' }}>❌</span>}
          <button type="button" onClick={() => setShow(s => !s)} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
            color: 'var(--c-text-3)', padding: '4px', lineHeight: 1,
          }} title={show ? 'Hide' : 'Show'}>
            {show ? '🙈' : '👁️'}
          </button>
        </div>
      </div>
      {matches && <div style={{ color: '#10b981', fontSize: '0.74rem', marginTop: 4 }}>✓ Passwords match</div>}
      {error   && <div style={{ color: 'var(--c-crimson)', fontSize: '0.74rem', marginTop: 4 }}>{error}</div>}
    </>
  )
}


// ── Delete confirmation ───────────────────────────────────────
function DeleteConfirm({ employee, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--c-surface)', borderRadius: 'var(--radius-lg)', padding: 32,
        maxWidth: 420, width: '100%', boxShadow: 'var(--shadow-xl)', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🗑️</div>
        <h3 style={{ margin: '0 0 8px' }}>Remove Employee?</h3>
        <p style={{ color: 'var(--c-text-2)', fontSize: '0.88rem', margin: '0 0 24px' }}>
          This will permanently delete <strong>{employee.Name}</strong> ({employee.Employee_ID}) from the database including their login credentials. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} style={{ background: 'var(--c-crimson)', color: '#fff' }}>
            🗑️ Yes, Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function EmployeesPage() {
  const { toasts, toast } = useToast()
  const [employees, setEmployees]   = useState(() => refreshEmployees())
  const [weekRef, setWeekRef]       = useState(new Date())
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [sending, setSending]       = useState(false)
  const [modal, setModal]           = useState(null) // null | 'add' | 'edit'
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch]         = useState('')

  const weekDates = getWeekDates(weekRef)
  const weekLabel = getWeekLabel(weekDates)

  const reload = () => {
    const fresh = refreshEmployees()
    setEmployees(fresh)
    // Keep selectedEmp in sync
    if (selectedEmp) {
      const updated = fresh.find(e => e.Employee_ID === selectedEmp.Employee_ID)
      setSelectedEmp(updated || null)
    }
  }

  const getShifts = (empId) => {
    const isoSet = new Set(weekDates.map(d => toISODate(d)))
    return MOCK_SHIFTS.filter(s => s.Employee_ID === empId && isoSet.has(s.Date))
  }

  const sendEmail = async (emp) => {
    setSending(true)
    const empShifts = getShifts(emp.Employee_ID)
    try {
      await n8nPost(API.SEND_EMAIL, {
        employee_id: emp.Employee_ID, employee_name: emp.Name, employee_email: emp.Email,
        week_label: weekLabel,
        shifts: weekDates.map(d => {
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

  const handleDelete = () => {
    deleteEmployee(deleteTarget.Employee_ID)
    deleteAuthEntry(deleteTarget.Employee_ID)
    if (selectedEmp?.Employee_ID === deleteTarget.Employee_ID) setSelectedEmp(null)
    toast.success('Employee Removed', `${deleteTarget.Name} has been removed from the database.`)
    setDeleteTarget(null)
    reload()
  }

  const filtered = employees.filter(e =>
    e.Name.toLowerCase().includes(search.toLowerCase()) ||
    e.Employee_ID.toLowerCase().includes(search.toLowerCase()) ||
    (e.Department || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.Position || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Topbar title="Employees" subtitle="Admin › Employee Management" />
      <ToastContainer toasts={toasts} />

      {modal && (
        <EmployeeModal
          mode={modal}
          employee={editTarget}
          toast={toast}
          onClose={() => { setModal(null); setEditTarget(null) }}
          onSaved={() => { setModal(null); setEditTarget(null); reload() }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          employee={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="page-content animate-fade-up">
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>👥 All Employees</h1>
            <p>Manage employee records, view schedules, and send email notifications</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { setModal('add'); setEditTarget(null) }}
          >
            ➕ Add Employee
          </button>
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: 20 }}>
          <input
            className="form-input"
            style={{ maxWidth: 380 }}
            placeholder="🔍  Search by name, ID, department, or position…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedEmp ? '300px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>

          {/* Employee Cards */}
          <div>
            <div style={{ marginBottom: 8, fontSize: '0.78rem', color: 'var(--c-text-3)' }}>
              {filtered.length} employee{filtered.length !== 1 ? 's' : ''} found
            </div>
            <div className="emp-grid" style={{ gridTemplateColumns: selectedEmp ? '1fr' : 'repeat(auto-fill,minmax(260px,1fr))' }}>
              {filtered.map(emp => (
                <div
                  key={emp.Employee_ID}
                  className={`emp-card ${selectedEmp?.Employee_ID === emp.Employee_ID ? 'selected' : ''}`}
                  onClick={() => setSelectedEmp(selectedEmp?.Employee_ID === emp.Employee_ID ? null : emp)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div className="emp-avatar" style={{ margin: 0 }}>{getInitials(emp.Name)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="emp-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.Name}</div>
                      <div className="emp-id">{emp.Employee_ID}</div>
                    </div>
                    {/* Action buttons — stop propagation so card click doesn't also select */}
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Edit"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => { setEditTarget(emp); setModal('edit') }}
                      >✏️</button>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Delete"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--c-crimson)' }}
                        onClick={() => setDeleteTarget(emp)}
                      >🗑️</button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--c-text-2)' }}>
                    <div>📁 {emp.Department}</div>
                    <div>💼 {emp.Position}</div>
                    <div>📧 {emp.Email}</div>
                    {emp.Employment_Type && <div>📄 {emp.Employment_Type}</div>}
                  </div>

                  {!selectedEmp && (
                    <div style={{ marginTop: 10 }}>
                      {getShifts(emp.Employee_ID).length > 0 ? (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {getShifts(emp.Employee_ID).slice(0, 3).map((s, i) => (
                            <span key={i} className={`badge ${shiftBadgeClass(s.Shift_Type)}`}>{s.Shift_Type}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>No shifts this week</span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
                  <h3>No employees found</h3>
                  <p>Try a different search or add a new employee</p>
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          {selectedEmp && (
            <div className="animate-fade-up">
              {/* Week nav */}
              <div className="week-nav" style={{ marginBottom: 16 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setWeekRef(d => addWeeks(d, -1))}>‹ Prev</button>
                <span className="week-nav-label">📅 {weekLabel}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setWeekRef(d => addWeeks(d, 1))}>Next ›</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setWeekRef(new Date())}>Today</button>
              </div>

              {/* Employee info card */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div className="emp-avatar" style={{ width: 56, height: 56, fontSize: '1.2rem', borderRadius: 16 }}>{getInitials(selectedEmp.Name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedEmp.Name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--c-text-2)' }}>{selectedEmp.Position} · {selectedEmp.Department}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>{selectedEmp.Employee_ID} · {selectedEmp.Email}</div>
                    {selectedEmp.Phone && <div style={{ fontSize: '0.78rem', color: 'var(--c-text-3)' }}>📞 {selectedEmp.Phone}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditTarget(selectedEmp); setModal('edit') }}>✏️ Edit</button>
                    <button className="btn btn-primary btn-sm" onClick={() => sendEmail(selectedEmp)} disabled={sending}>
                      {sending ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Sending…</> : '📧 Email Schedule'}
                    </button>
                  </div>
                </div>

                {/* Extra info chips */}
                {(selectedEmp.Employment_Type || selectedEmp.Date_Hired || selectedEmp.License_No || selectedEmp.Blood_Type) && (
                  <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedEmp.Employment_Type && <span className="badge badge-morning">{selectedEmp.Employment_Type}</span>}
                    {selectedEmp.Date_Hired      && <span style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>📅 Hired: {selectedEmp.Date_Hired}</span>}
                    {selectedEmp.License_No      && <span style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>🪪 {selectedEmp.License_No}</span>}
                    {selectedEmp.Blood_Type      && <span style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>🩸 {selectedEmp.Blood_Type}</span>}
                    {selectedEmp.Civil_Status    && <span style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>👤 {selectedEmp.Civil_Status}</span>}
                  </div>
                )}
              </div>

              {/* Weekly schedule table */}
              <div className="card">
                <div className="card-header">
                  <h2>📋 Weekly Schedule</h2>
                  <span style={{ fontSize: '0.78rem', color: 'var(--c-text-3)' }}>{weekLabel}</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Day</th><th>Date</th><th>Shift</th><th>Time</th><th>Room</th><th>Notes</th></tr>
                    </thead>
                    <tbody>
                      {weekDates.map((d, i) => {
                        const iso = toISODate(d)
                        const s = MOCK_SHIFTS.find(sh => sh.Employee_ID === selectedEmp.Employee_ID && sh.Date === iso)
                        return (
                          <tr key={i} style={isToday(d) ? { background: 'var(--c-teal-pale)' } : {}}>
                            <td style={{ fontWeight: isToday(d) ? 700 : 400 }}>{DAYS_SHORT[d.getDay()]}{isToday(d) && ' ◀'}</td>
                            <td>{d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</td>
                            <td>{s ? <span className={`badge ${shiftBadgeClass(s.Shift_Type)}`}>{s.Shift_Type}</span> : '—'}</td>
                            <td style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>{s?.Start_Time && s?.End_Time ? `${s.Start_Time} – ${s.End_Time}` : '—'}</td>
                            <td style={{ fontSize: '0.82rem' }}>{s?.Room_ID || '—'}</td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--c-text-2)' }}>{s?.Notes || ''}</td>
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