import { useEffect, useState } from 'react'
import { getNotifications, markAsRead, type NotificationItem } from '../services/notificationService'
import { Bell, Check } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchNotifications = async (p = page) => {
    setLoading(true)
    try {
      const res = await getNotifications(p, 20)
      const data = res.data
      if (data && typeof data === 'object' && 'content' in data) {
        setNotifications(data.content ?? [])
        setTotalPages(data.totalPages ?? 0)
      } else if (Array.isArray(data)) {
        setNotifications(data)
        setTotalPages(0)
      } else {
        setNotifications([])
        setTotalPages(0)
      }
    } catch {
      setError('Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifications(page) }, [page])

  const handleMarkRead = async (id: number) => {
    try {
      await markAsRead(id)
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    } catch { /* ignore */ }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Notifications</h1>
          <p className="page__subtitle">Stay updated on document changes and actions.</p>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="card">
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} strokeWidth={1} className="text-muted" />
            <p className="text-muted">No notifications yet.</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((n) => (
              <div key={n.id} className={`notification-item ${n.read ? 'notification-item--read' : ''}`}>
                <div className="notification-item__content">
                  <p className="notification-item__message">{n.message}</p>
                  <p className="text-sm text-muted">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.read && (
                  <button type="button" className="btn btn--sm btn--ghost" onClick={() => handleMarkRead(n.id)}>
                    <Check size={14} /> Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button type="button" className="btn btn--sm btn--ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="pagination__info">Page {page + 1} / {totalPages}</span>
          <button type="button" className="btn btn--sm btn--ghost" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  )
}
