export const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
export const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export function getWeekDates(referenceDate = new Date()) {
  const date = new Date(referenceDate)
  const day = date.getDay() // 0=Sun
  const monday = new Date(date)
  monday.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function toISODate(d) {
  if (!d) return ''
  const date = new Date(d)
  return date.toISOString().split('T')[0]
}

export function formatDate(d, opts = {}) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', ...opts
  })
}

export function formatDateFull(d) {
  return formatDate(d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function getWeekLabel(dates) {
  if (!dates?.length) return ''
  const start = dates[0]
  const end = dates[dates.length - 1]
  const fmt = d => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}, ${new Date(end).getFullYear()}`
}

export function isToday(d) {
  const t = new Date(); t.setHours(0,0,0,0)
  const dd = new Date(d); dd.setHours(0,0,0,0)
  return t.getTime() === dd.getTime()
}

export function addWeeks(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n * 7)
  return d
}

export function getInitials(name = '') {
  return name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()
}

export function shiftBadgeClass(type) {
  const t = (type || '').toLowerCase()
  if (t === 'morning')   return 'badge-morning'
  if (t === 'afternoon') return 'badge-afternoon'
  if (t === 'night')     return 'badge-night'
  if (t === 'off')       return 'badge-off'
  return ''
}

export function shiftChipClass(type) {
  const t = (type || '').toLowerCase()
  if (t === 'morning')   return 'shift-morning'
  if (t === 'afternoon') return 'shift-afternoon'
  if (t === 'night')     return 'shift-night'
  return 'shift-off'
}
