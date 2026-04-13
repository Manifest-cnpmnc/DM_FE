import { useEffect, useState } from 'react'
import { getAuditLogs, type AuditLogItem } from '../services/auditLogService'
import { Search } from 'lucide-react'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [actionFilter, setActionFilter] = useState('')

  const fetchLogs = async (p = page) => {
    setLoading(true)
    try {
      const res = await getAuditLogs({
        action: actionFilter || undefined,
        page: p,
        size: 20,
      })
      setLogs(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 0)
    } catch {
      setError('Failed to load audit logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs(page) }, [page])

  const handleSearch = () => {
    setPage(0)
    fetchLogs(0)
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Audit Logs</h1>
          <p className="page__subtitle">View system activity and change history.</p>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="filters">
        <div className="filters__field filters__field--grow">
          <Search size={16} className="filters__icon" />
          <input
            className="filters__input"
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button type="button" className="btn btn--secondary" onClick={handleSearch}>Search</button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>User</th>
              <th>Entity</th>
              <th>Details</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="table__empty">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="table__empty">No logs found.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td><span className="badge badge--neutral">{log.action}</span></td>
                  <td>{log.userName}</td>
                  <td>{log.entityType} #{log.entityId}</td>
                  <td className="table__desc">{log.details || '—'}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
