import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  getDocuments,
  getDocumentDownloadUrl,
  type DocumentItem,
  type DocumentStatus,
  type DocumentVisibility,
} from '../services/documentService'
import { getAuthUser } from '../services/authService'
import { Search, Download, ShieldAlert, Lock, Globe, Building2 } from 'lucide-react'

const statusColors: Record<DocumentStatus, string> = {
  DRAFT: '#f59e0b',
  PENDING_REVIEW: '#6366f1',
  APPROVED: '#16a34a',
  REJECTED: '#dc2626',
  ARCHIVED: '#6b7280',
}

const visibilityLabel: Record<DocumentVisibility, string> = {
  PRIVATE: 'Private',
  PUBLIC: 'Public',
  ORG_INTERNAL: 'Org Internal',
  ORG_PUBLIC: 'Org Public',
}

const VisibilityIcon = ({ visibility, size = 11 }: { visibility: DocumentVisibility; size?: number }) => {
  if (visibility === 'PUBLIC' || visibility === 'ORG_PUBLIC') return <Globe size={size} />
  if (visibility === 'PRIVATE') return <Lock size={size} />
  return <Building2 size={size} />
}

export default function AdminDocumentsPage() {
  const navigate = useNavigate()
  const user = getAuthUser()

  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTitle, setSearchTitle] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'personal' | 'org'>('all')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [downloadId, setDownloadId] = useState<number | null>(null)

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/documents" replace />
  }

  const fetchDocs = async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getDocuments({ page: p, size: 20 })
      setDocuments(res.data.content)
      setTotalPages(res.data.totalPages)
      setTotalElements(res.data.totalElements)
    } catch {
      setError('Could not load documents.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs(page) }, [page])

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (searchTitle && !d.title.toLowerCase().includes(searchTitle.toLowerCase())
        && !d.createdByName.toLowerCase().includes(searchTitle.toLowerCase())) return false
      if (statusFilter && d.status !== statusFilter) return false
      if (visibilityFilter && d.visibility !== visibilityFilter) return false
      if (scopeFilter === 'personal' && d.organizationId) return false
      if (scopeFilter === 'org' && !d.organizationId) return false
      return true
    })
  }, [documents, searchTitle, statusFilter, visibilityFilter, scopeFilter])

  const handleDownload = async (doc: DocumentItem) => {
    setDownloadId(doc.id)
    try {
      const url = await getDocumentDownloadUrl(doc.id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      setError('Download failed.')
    } finally {
      setDownloadId(null)
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={22} />
            <h1 className="page__title">All Documents</h1>
          </div>
          <p className="page__subtitle">Admin view of every document in the system — personal PRIVATE files included.</p>
        </div>
      </div>

      <div className="admin-banner">
        <ShieldAlert size={16} />
        <div>
          <strong>Admin context.</strong> You can view and download private files belonging to other users.
          Every access is recorded in <code>audit_logs</code>. Use only for moderation, recovery, or legal review.
        </div>
      </div>

      <div className="filters">
        <div className="filters__field filters__field--grow">
          <Search size={16} className="filters__icon" />
          <input
            className="filters__input"
            type="search"
            placeholder="Search by title or author..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
          />
        </div>
        <select className="filters__select" value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value as 'all' | 'personal' | 'org')}>
          <option value="all">All scopes</option>
          <option value="personal">Personal only</option>
          <option value="org">Organization only</option>
        </select>
        <select className="filters__select" value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)}>
          <option value="">All visibilities</option>
          <option value="PRIVATE">Private</option>
          <option value="PUBLIC">Public</option>
          <option value="ORG_INTERNAL">Org Internal</option>
          <option value="ORG_PUBLIC">Org Public</option>
        </select>
        <select className="filters__select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Scope</th>
              <th>Visibility</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="table__empty">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="table__empty">No documents found.</td></tr>
            ) : (
              filtered.map((doc) => (
                <tr key={doc.id} className="table__row--clickable" onClick={() => navigate(`/documents/${doc.id}`)}>
                  <td>
                    <div className="table__title">{doc.title}</div>
                    <div className="table__desc">{doc.description}</div>
                  </td>
                  <td>{doc.createdByName}</td>
                  <td>{doc.organizationName || <span className="text-muted">Personal</span>}</td>
                  <td>
                    <span className="badge badge--neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <VisibilityIcon visibility={doc.visibility} /> {visibilityLabel[doc.visibility]}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{
                      background: `${statusColors[doc.status] ?? '#e5e7eb'}22`,
                      color: statusColors[doc.status] ?? '#374151',
                      border: `1px solid ${statusColors[doc.status] ?? '#e5e7eb'}44`,
                    }}>
                      {doc.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{new Date(doc.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--sm btn--secondary"
                      onClick={(e) => { e.stopPropagation(); handleDownload(doc) }}
                      disabled={downloadId === doc.id}
                    >
                      <Download size={14} />
                      {downloadId === doc.id ? 'Opening…' : 'Download'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button type="button" className="btn btn--sm btn--ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
        <span className="pagination__info">
          Page {page + 1} / {Math.max(totalPages, 1)} · {totalElements} total
        </span>
        <button type="button" className="btn btn--sm btn--ghost" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  )
}
