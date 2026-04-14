import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPublicDocuments,
  getDocumentDownloadUrl,
  type DocumentItem,
  type DocumentStatus,
} from '../services/documentService'
import { Search, Download, Globe } from 'lucide-react'

const statusColors: Record<DocumentStatus, string> = {
  DRAFT: '#f59e0b',
  PENDING_REVIEW: '#6366f1',
  APPROVED: '#16a34a',
  REJECTED: '#dc2626',
  ARCHIVED: '#6b7280',
}

export default function ExplorePage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTitle, setSearchTitle] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [downloadId, setDownloadId] = useState<number | null>(null)

  const fetchDocs = async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPublicDocuments({ page: p, size: 20 })
      setDocuments(res.data.content)
      setTotalPages(res.data.totalPages)
    } catch {
      setError('Could not load public feed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs(page) }, [page])

  const filtered = useMemo(() => {
    return documents.filter((d) =>
      !searchTitle || d.title.toLowerCase().includes(searchTitle.toLowerCase())
    )
  }, [documents, searchTitle])

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
            <Globe size={22} />
            <h1 className="page__title">Explore</h1>
          </div>
          <p className="page__subtitle">Public personal files shared by other users.</p>
        </div>
      </div>

      <div className="filters">
        <div className="filters__field filters__field--grow">
          <Search size={16} className="filters__icon" />
          <input
            className="filters__input"
            type="search"
            placeholder="Search public files..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Author</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="table__empty">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="table__empty">No public documents found.</td></tr>
            ) : (
              filtered.map((doc) => (
                <tr key={doc.id} className="table__row--clickable" onClick={() => navigate(`/explore/${doc.id}`)}>
                  <td>
                    <div className="table__title">{doc.title}</div>
                    <div className="table__desc">{doc.description}</div>
                  </td>
                  <td>{doc.categoryName ?? '—'}</td>
                  <td>{doc.createdByName}</td>
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
