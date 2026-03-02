// ============================================================
// JISCare — n8n Webhook Configuration
// Set VITE_N8N_BASE_URL in your .env.local file:
//   VITE_N8N_BASE_URL=https://your-n8n-instance.com/webhook
// ============================================================

const N8N_BASE = import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678/webhook'

export const API = {
  // ── AI / Validation Workflows ────────────────────────────────
  SCHEDULE_CHECK:   `${N8N_BASE}/schedule-check`,
  DAYOFF_SUBMIT:    `${N8N_BASE}/dayoff-submit`,

  // ── Data Sync Workflows (Workflow 3) ─────────────────────────
  CREATE_SHIFT:     `${N8N_BASE}/create-shift`,
  GET_SHIFTS:       `${N8N_BASE}/get-shifts`,
  DELETE_SHIFT:     `${N8N_BASE}/delete-shift`,

  CREATE_EMPLOYEE:  `${N8N_BASE}/create-employee`,
  GET_EMPLOYEES:    `${N8N_BASE}/get-employees`,
  DELETE_EMPLOYEE:  `${N8N_BASE}/delete-employee`,

  GET_DAYOFFS:      `${N8N_BASE}/get-dayoffs`,
  UPDATE_DAYOFF:    `${N8N_BASE}/update-dayoff`,

  GET_AUTH:         `${N8N_BASE}/get-auth`,

  // ── Email ────────────────────────────────────────────────────
  SEND_EMAIL:       `${N8N_BASE}/send-schedule-email`,
}

export async function n8nPost(url, body) {
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Network error' }))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}
