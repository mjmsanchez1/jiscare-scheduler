export default function ToastContainer({ toasts }) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' }
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{icons[t.type]}</span>
          <div className="toast-text">
            <div className="toast-title">{t.title}</div>
            {t.message && <div className="toast-msg">{t.message}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
