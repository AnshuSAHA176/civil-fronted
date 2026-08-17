import { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCircle2, MessageSquare, RefreshCw, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { getApiError } from '../../services/apiClient'
import { getNotifications } from '../../features/notifications.api'

const formatDate = (value) => {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const normalizeNotifications = (data) => {
  if (Array.isArray(data)) return data
  if (data?.notification === 'no new notification') return []
  return []
}

const getNotificationIcon = (notification) => {
  if (notification?.complain) return <MessageSquare size={18} aria-hidden="true" />
  if (notification?.rti) return <FileText size={18} aria-hidden="true" />
  return <Bell size={18} aria-hidden="true" />
}

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getNotifications()
      setNotifications(normalizeNotifications(response.data))
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadNotifications() }, [loadNotifications])

  const openRelatedResource = (notification) => {
    if (notification?.complain) {
      navigate(`/hod/complaints/${encodeURIComponent(notification.complain)}`)
    }
  }

  if (loading) {
    return (
      <section className="page-section notification-page" aria-busy="true">
        <div className="page-heading">
          <p className="eyebrow">Updates</p>
          <h1>Notifications</h1>
          <p>Department updates, complaint assignments, and other CivicAI activity.</p>
        </div>
        <div className="page-loading"><Spinner /><span>Loading notifications…</span></div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page-section notification-page">
        <div className="page-heading">
          <p className="eyebrow">Updates</p>
          <h1>Notifications</h1>
          <p>Department updates, complaint assignments, and other CivicAI activity.</p>
        </div>
        <ErrorState title="Unable to load notifications" description={error.message} onRetry={loadNotifications} />
      </section>
    )
  }

  return (
    <section className="page-section notification-page">
      <div className="page-heading notification-heading">
        <div>
          <p className="eyebrow">Updates</p>
          <h1>Notifications</h1>
          <p>Department updates, complaint assignments, and other CivicAI activity.</p>
        </div>
        <Button variant="secondary" onClick={loadNotifications} aria-label="Refresh notifications">
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <div className="notification-read-behavior" role="note">
        <CheckCircle2 size={16} aria-hidden="true" />
        <span>Notifications shown here are marked as read when the backend delivers them.</span>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="You're all caught up"
          description="There are no new notifications for your account right now."
        />
      ) : (
        <div className="notification-list" aria-label="HOD notifications">
          {notifications.map((notification, index) => {
            const hasComplaint = Boolean(notification?.complain)
            const hasRti = Boolean(notification?.rti)
            const actionable = hasComplaint

            return (
              <article
                className={`notification-item ${actionable ? 'notification-item-actionable' : ''}`}
                key={notification?.id || `${notification?.created_at || 'notification'}-${index}`}
              >
                <div className="notification-icon" aria-hidden="true">{getNotificationIcon(notification)}</div>
                <div className="notification-content">
                  <div className="notification-title-row">
                    <h2>{notification?.title || 'CivicAI update'}</h2>
                    <time dateTime={notification?.created_at || undefined}>{formatDate(notification?.created_at)}</time>
                  </div>
                  <p>{notification?.message || 'You have a new CivicAI update.'}</p>
                  <div className="notification-meta">
                    {hasComplaint && <span>Complaint update</span>}
                    {hasRti && <span>RTI update</span>}
                  </div>
                </div>
                {actionable && (
                  <Button variant="secondary" onClick={() => openRelatedResource(notification)}>
                    View complaint
                  </Button>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
