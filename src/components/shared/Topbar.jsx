import { formatDate } from '../../utils/dateUtils'

export default function Topbar({ title, subtitle }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <div className="topbar-title">{title}</div>
          {subtitle && <div className="topbar-breadcrumb">{subtitle}</div>}
        </div>
      </div>
      <div className="topbar-right">
        <span style={{ fontSize: '0.78rem', color: 'var(--c-text-3)' }}>
          📅 {formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </header>
  )
}
