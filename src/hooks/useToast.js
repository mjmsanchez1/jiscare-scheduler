import { useState, useCallback } from 'react'

let idCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((type, title, message, duration = 4000) => {
    const id = ++idCounter
    setToasts(prev => [...prev, { id, type, title, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const toast = {
    success: (title, msg) => addToast('success', title, msg),
    error:   (title, msg) => addToast('error',   title, msg),
    info:    (title, msg) => addToast('info',     title, msg),
  }

  return { toasts, toast }
}
