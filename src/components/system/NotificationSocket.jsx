import { useEffect, useRef, useState } from 'react'
import storage from '../../utils/storage'
import './NotificationSocket.css'

const getWebSocketBase = () => {
  const explicit = import.meta.env.VITE_WS_BASE_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const apiBase = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/$/, '')
  try {
    const url = new URL(apiBase)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return url.toString().replace(/\/$/, '')
  } catch {
    return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  }
}

export default function NotificationSocket() {
  const socketRef = useRef(null)
  const retryRef = useRef(null)
  const attemptsRef = useRef(0)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let stopped = false

    const connect = () => {
      if (stopped) return

      const token = storage.getAccessToken()
      if (!token) return

      const base = getWebSocketBase()
      const url = `${base}/ws/notifications/?token=${encodeURIComponent(token)}`
      const socket = new WebSocket(url)
      socketRef.current = socket

      socket.onopen = () => {
        attemptsRef.current = 0
        window.dispatchEvent(new CustomEvent('civicai:websocket-connected'))
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const notification = data?.data || data?.notification || data

          if (!notification) return

          window.dispatchEvent(
            new CustomEvent('civicai:notification', { detail: notification }),
          )

          setToast({
            id: Date.now(),
            title: notification?.title || 'CivicAI update',
            message: notification?.message || 'You have a new notification.',
          })
        } catch {
          // Ignore malformed WebSocket frames without breaking the app.
        }
      }

      socket.onerror = () => {
        window.dispatchEvent(new CustomEvent('civicai:websocket-error'))
      }

      socket.onclose = () => {
        socketRef.current = null
        window.dispatchEvent(new CustomEvent('civicai:websocket-disconnected'))

        if (stopped) return

        attemptsRef.current += 1
        const delay = Math.min(30000, 1000 * 2 ** Math.min(attemptsRef.current, 5))
        retryRef.current = window.setTimeout(connect, delay)
      }
    }

    connect()

    const reconnect = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) return
      window.clearTimeout(retryRef.current)
      connect()
    }

    window.addEventListener('civicai:session-changed', reconnect)

    return () => {
      stopped = true
      window.clearTimeout(retryRef.current)
      window.removeEventListener('civicai:session-changed', reconnect)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 6000)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (!toast) return null

  return (
    <button
      type="button"
      className="civicai-live-toast"
      onClick={() => setToast(null)}
      aria-label="Dismiss notification"
    >
      <span className="civicai-live-toast-dot" />
      <span>
        <strong>{toast.title}</strong>
        <small>{toast.message}</small>
      </span>
    </button>
  )
}
