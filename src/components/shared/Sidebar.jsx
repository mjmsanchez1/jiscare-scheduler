import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/dateUtils'

const ADMIN_NAV = [
  { to: '/admin/dashboard',   icon: '📊', label: 'Dashboard' },
  { to: '/admin/schedule',    icon: '📅', label: 'Create Schedule' },
  { to: '/admin/employees',   icon: '👥', label: 'Employees' },
  { to: '/admin/checker',     icon: '🤖', label: 'AI Conflict Checker' },
  { to: '/admin/dayoff',      icon: '🗓️', label: 'Day-Off Requests' },
]

const EMP_NAV = [
  { to: '/employee/my-schedule', icon: '📅', label: 'My Schedule' },
  { to: '/employee/dayoff',      icon: '✈️', label: 'Request Day Off' },
]

// ── Profile Photo helpers (stored in localStorage per user) ──────────
const PHOTO_KEY = (id) => `jiscare_photo_${id}`

function loadPhoto(userId) {
  try { return localStorage.getItem(PHOTO_KEY(userId)) || null } catch { return null }
}

function savePhoto(userId, dataUrl) {
  try { localStorage.setItem(PHOTO_KEY(userId), dataUrl) } catch {}
}

function removePhoto(userId) {
  try { localStorage.removeItem(PHOTO_KEY(userId)) } catch {}
}

// ── Profile Modal ─────────────────────────────────────────────────────
function ProfileModal({ user, photo, onClose, onPhotoChange }) {
  const fileRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview]   = useState(photo)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files[0])
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      if (preview) savePhoto(user.id, preview)
      else removePhoto(user.id)
      onPhotoChange(preview)
      setSaving(false)
      setSaved(true)
      setTimeout(() => { setSaved(false); onClose() }, 900)
    }, 600)
  }

  const handleRemove = () => setPreview(null)

  // Close on Escape
  useEffect(() => {
    const fn = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.18s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 9999,
        width: 420,
        background: 'var(--c-surface, #fff)',
        borderRadius: 20,
        boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
        overflow: 'hidden',
        animation: 'modalSlideIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Modal header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--c-teal, #14A085), var(--c-teal-dark, #0D7377))',
          padding: '22px 24px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem' }}>Edit Profile Photo</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem', marginTop: 2 }}>
              Upload a photo to personalise your account
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
              width: 32, height: 32, cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >✕</button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* User info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px',
            background: 'var(--c-teal-pale, #E8F8F7)',
            borderRadius: 12, marginBottom: 20,
          }}>
            {/* Current avatar preview */}
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              border: '2.5px solid var(--c-teal, #14A085)',
              overflow: 'hidden', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--c-teal, #14A085), var(--c-teal-dark, #0D7377))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {preview
                ? <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{getInitials(user?.name)}</span>
              }
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--c-text-1, #111)' }}>{user?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--c-text-3, #9ca3af)', marginTop: 2 }}>
                {user?.position || user?.role} · {user?.dept || 'JISCare'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--c-text-3, #9ca3af)', fontFamily: 'monospace' }}>{user?.id}</div>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragging ? 'var(--c-teal, #14A085)' : 'var(--c-border, #e5e7eb)'}`,
              borderRadius: 14,
              padding: '28px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'var(--c-teal-pale, #E8F8F7)' : 'var(--c-bg, #f9fafb)',
              transition: 'all 0.2s',
              marginBottom: 16,
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => processFile(e.target.files[0])}
            />
            <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>
              {preview ? '🖼️' : '📸'}
            </div>
            {preview ? (
              <>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--c-text-1)' }}>Photo selected</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--c-text-3)', marginTop: 4 }}>Click to choose a different one</div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--c-text-1)' }}>
                  Click to upload or drag & drop
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--c-text-3)', marginTop: 4 }}>
                  PNG, JPG, WEBP · Max 5MB
                </div>
              </>
            )}
          </div>

          {/* Preview strip if photo selected */}
          {preview && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              background: 'var(--c-bg, #f9fafb)',
              borderRadius: 10, marginBottom: 16, border: '1px solid var(--c-border)',
            }}>
              <img
                src={preview}
                alt="Your photo"
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--c-teal, #14A085)' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--c-text-1)' }}>New photo preview</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--c-text-3)' }}>This will appear in your sidebar & employee card</div>
              </div>
              <button
                onClick={handleRemove}
                style={{
                  background: 'var(--c-crimson-light, #fee2e2)', border: 'none', borderRadius: 6,
                  padding: '5px 10px', cursor: 'pointer', fontSize: '0.72rem',
                  color: 'var(--c-crimson, #ef4444)', fontWeight: 600, transition: 'opacity 0.2s',
                }}
              >Remove</button>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '10px', borderRadius: 10,
                border: '1.5px solid var(--c-border)', background: 'transparent',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
                color: 'var(--c-text-2)', transition: 'all 0.2s',
              }}
            >Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                flex: 2, padding: '10px', borderRadius: 10,
                border: 'none',
                background: saved
                  ? 'var(--c-teal-dark, #0D7377)'
                  : 'linear-gradient(135deg, var(--c-teal, #14A085), var(--c-teal-dark, #0D7377))',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem', fontWeight: 700,
                color: '#fff', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: saving ? 0.8 : 1,
              }}
            >
              {saved ? '✅ Saved!' : saving ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    display: 'inline-block', animation: 'spin 0.7s linear infinite',
                  }} />
                  Saving…
                </>
              ) : '💾 Save Photo'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translate(-50%,-50%) scale(0.88); }
          to   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

// ── Avatar component (used in sidebar + can be re-exported) ──────────
export function UserAvatar({ userId, name, size = 36, fontSize = '0.85rem', borderRadius = 10 }) {
  const [photo, setPhoto] = useState(() => loadPhoto(userId))

  useEffect(() => {
    // Re-check when userId changes (e.g. admin viewing different accounts)
    setPhoto(loadPhoto(userId))
  }, [userId])

  // Listen for custom photo-update events
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.userId === userId) setPhoto(e.detail.photo)
    }
    window.addEventListener('jiscare:photo-updated', handler)
    return () => window.removeEventListener('jiscare:photo-updated', handler)
  }, [userId])

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        style={{
          width: size, height: size, borderRadius,
          objectFit: 'cover',
          border: '2px solid rgba(255,255,255,0.25)',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <div
      className="avatar"
      style={{
        width: size, height: size, borderRadius,
        fontSize, flexShrink: 0,
        background: 'linear-gradient(135deg,rgba(255,255,255,0.25),rgba(255,255,255,0.1))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 800,
        border: '2px solid rgba(255,255,255,0.2)',
      }}
    >
      {getInitials(name)}
    </div>
  )
}

// ── Main Sidebar ─────────────────────────────────────────────────────
export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const nav = user?.role === 'admin' ? ADMIN_NAV : EMP_NAV

  const [photo, setPhoto]           = useState(() => loadPhoto(user?.id))
  const [showModal, setShowModal]   = useState(false)
  const [avatarHover, setAvatarHover] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handlePhotoChange = useCallback((newPhoto) => {
    setPhoto(newPhoto)
    // Broadcast to other components (e.g., EmployeesPage employee cards)
    window.dispatchEvent(new CustomEvent('jiscare:photo-updated', {
      detail: { userId: user?.id, photo: newPhoto }
    }))
  }, [user?.id])

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">🏥</div>
            <div className="logo-text">
              <span className="logo-name">JISCare</span>
              <span className="logo-sub">Scheduler System</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">
            {user?.role === 'admin' ? 'Management' : 'My Portal'}
          </div>
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {/* Clickable profile area */}
          <button
            onClick={() => setShowModal(true)}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            title="Edit profile photo"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 8px', borderRadius: 10,
              transition: 'background 0.2s',
              background: avatarHover ? 'rgba(255,255,255,0.07)' : 'transparent',
              textAlign: 'left',
            }}
          >
            {/* Avatar with camera overlay on hover */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {photo ? (
                <img
                  src={photo}
                  alt={user?.name}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    objectFit: 'cover',
                    border: '2px solid rgba(255,255,255,0.25)',
                    transition: 'filter 0.2s',
                    filter: avatarHover ? 'brightness(0.7)' : 'none',
                  }}
                />
              ) : (
                <div
                  className="avatar"
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    fontSize: '0.85rem', margin: 0,
                    transition: 'filter 0.2s',
                    filter: avatarHover ? 'brightness(0.7)' : 'none',
                  }}
                >
                  {getInitials(user?.name)}
                </div>
              )}

              {/* Camera icon overlay */}
              {avatarHover && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem',
                  animation: 'fadeIn 0.15s ease',
                }}>📷</div>
              )}
            </div>

            <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {user?.name}
                {avatarHover && (
                  <span style={{
                    fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)',
                    fontWeight: 400, whiteSpace: 'nowrap',
                  }}>· edit photo</span>
                )}
              </div>
              <div className="user-role">{user?.position || user?.role}</div>
            </div>
          </button>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="sidebar-item"
            style={{
              width: '100%', marginTop: 4, background: 'none',
              border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
            }}
          >
            <span>🚪</span><span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Profile photo modal */}
      {showModal && (
        <ProfileModal
          user={user}
          photo={photo}
          onClose={() => setShowModal(false)}
          onPhotoChange={handlePhotoChange}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  )
}