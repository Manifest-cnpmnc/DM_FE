import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getDocuments,
  downloadDocument,
  uploadDocument,
  type DocumentItem,
} from '../services/documentService'
import { getCategories, type CategoryItem } from '../services/categoryService'
import { Search, Download, Plus, X, Upload } from 'lucide-react'

const statusColors: Record<string, string> = {
  DRAFT: '#f59e0b',
  PENDING_REVIEW: '#6366f1',
  APPROVED: '#16a34a',
  REJECTED: '#dc2626',
  ARCHIVED: '#6b7280',
}

export default function DocumentsPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTitle, setSearchTitle] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [downloadId, setDownloadId] = useState<number | null>(null)

  // Upload modal
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadCategory, setUploadCategory] = useState('')
  const [uploadTags, setUploadTags] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = async (
    p: number,
    filters: { title: string; status: string; category: string }
  ) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getDocuments({
        title: filters.title || undefined,
        status: filters.status || undefined,
        categoryId: filters.category ? Number(filters.category) : undefined,
        page: p,
        size: 20,
      })
      setDocuments(response.data.content)
      setTotalPages(response.data.totalPages)
    } catch {
      setError('Could not load documents.')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await getCategories()
      setCategories(Array.isArray(res.data) ? res.data : [])
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchDocuments(page, { title: searchTitle, status: statusFilter, category: categoryFilter })
  }, [page, statusFilter, categoryFilter])

  const handleSearch = () => {
    setPage(0)
    fetchDocuments(0, { title: searchTitle, status: statusFilter, category: categoryFilter })
  }

  const handleDownload = async (doc: DocumentItem) => {
    setDownloadId(doc.id)
    try {
      const blob = await downloadDocument(doc.id)
      const ext = doc.latestFileUrl?.split('.').pop() || 'bin'
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${doc.title}.${ext}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)
    } catch {
      setError('Download failed.')
    } finally {
      setDownloadId(null)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim() || !uploadCategory) return
    setUploading(true)
    try {
      await uploadDocument(uploadFile, {
        title: uploadTitle.trim(),
        description: uploadDesc.trim() || undefined,
        categoryId: Number(uploadCategory),
        tags: uploadTags ? uploadTags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      })
      setShowUpload(false)
      setUploadFile(null)
      setUploadTitle('')
      setUploadDesc('')
      setUploadCategory('')
      setUploadTags('')
      fetchDocuments(0, { title: searchTitle, status: statusFilter, category: categoryFilter })
    } catch {
      setError('Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Documents</h1>
          <p className="page__subtitle">Browse, upload, and manage documents.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowUpload(true)}>
          <Plus size={18} /> Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filters__field filters__field--grow">
          <Search size={16} className="filters__icon" />
          <input
            className="filters__input"
            type="search"
            placeholder="Search by title..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <select className="filters__select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select className="filters__select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="button" className="btn btn--secondary" onClick={handleSearch}>Search</button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Author</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="table__empty">Loading...</td></tr>
            ) : documents.length === 0 ? (
              <tr><td colSpan={6} className="table__empty">No documents found.</td></tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="table__row--clickable" onClick={() => navigate(`/documents/${doc.id}`)}>
                  <td>
                    <div className="table__title">{doc.title}</div>
                    <div className="table__desc">{doc.description}</div>
                  </td>
                  <td>{doc.categoryName}</td>
                  <td>
                    <span className="badge" style={{
                      background: `${statusColors[doc.status] ?? '#e5e7eb'}22`,
                      color: statusColors[doc.status] ?? '#374151',
                      border: `1px solid ${statusColors[doc.status] ?? '#e5e7eb'}44`,
                    }}>
                      {doc.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{doc.createdByName}</td>
                  <td>{new Date(doc.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--sm btn--secondary"
                      onClick={(e) => { e.stopPropagation(); handleDownload(doc) }}
                      disabled={downloadId === doc.id}
                    >
                      <Download size={14} />
                      {downloadId === doc.id ? 'Downloading...' : 'Download'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button type="button" className="btn btn--sm btn--ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="pagination__info">Page {page + 1} / {totalPages}</span>
          <button type="button" className="btn btn--sm btn--ghost" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Upload Document</h2>
              <button type="button" className="btn btn--icon" onClick={() => !uploading && setShowUpload(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="form-field">
                <label className="form-field__label">Title *</label>
                <input className="form-field__input" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Document title" />
              </div>
              <div className="form-field">
                <label className="form-field__label">Description</label>
                <textarea className="form-field__textarea" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} placeholder="Optional description" rows={3} />
              </div>
              <div className="form-field">
                <label className="form-field__label">Category *</label>
                <select className="form-field__input" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-field__label">Tags</label>
                <input className="form-field__input" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="tag1, tag2, tag3" />
              </div>
              <div className="form-field">
                <label className="form-field__label">File *</label>
                <input ref={fileInputRef} type="file" className="form-field__input" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setShowUpload(false)} disabled={uploading}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={handleUpload} disabled={uploading || !uploadFile || !uploadTitle.trim() || !uploadCategory}>
                <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
