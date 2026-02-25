// ============================================================
// JISCare — n8n Webhook Configuration
// Replace these URLs with your actual n8n instance URLs
// ============================================================

const N8N_BASE = import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678/webhook'

export const API = {
  // Schedule Conflict Checker (Workflow 2)
  SCHEDULE_CHECK: `${N8N_BASE}/schedule-check`,

  // Day-Off Request Handler (Workflow 1)
  DAYOFF_SUBMIT:  `${N8N_BASE}/dayoff-submit`,

  // NEW WEBHOOKS — Add these to your n8n:
  // Webhook path: "create-shift"
  CREATE_SHIFT:   `${N8N_BASE}/create-shift`,

  // Webhook path: "get-shifts"
  GET_SHIFTS:     `${N8N_BASE}/get-shifts`,

  // Webhook path: "get-employees"
  GET_EMPLOYEES:  `${N8N_BASE}/get-employees`,

  // Webhook path: "send-schedule-email"
  SEND_EMAIL:     `${N8N_BASE}/send-schedule-email`,
}

// Helper: post JSON to n8n webhook
export async function n8nPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Network error' }))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}
