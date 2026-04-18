import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPersonalDocuments,
  getDocumentDownloadUrl,
  uploadDocument,
  deleteDocument,
  type DocumentItem,
  type DocumentStatus,
  type DocumentVisibility,
} from '../services/documentService'
import { getCategories, type CategoryItem } from '../services/categoryService'
import { Search, Download, Plus, X, Upload, Lock, Globe, Trash2 } from 'lucide-react'

const statusColors: Record<DocumentStatus, string> = {
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
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(new Set())

  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadCategory, setUploadCategory] = useState('')
  const [uploadTags, setUploadTags] = useState('')
  const [uploadVisibility, setUploadVisibility] = useState<DocumentVisibility>('PRIVATE')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPersonalDocuments({ page: p, size: 20 })
      setDocuments(res.data.content)
      setTotalPages(res.data.totalPages)
    } catch {
      setError('Could not load documents.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data)).catch(() => undefined)
  }, [])

  useEffect(() => {
    fetchDocuments(page)
  }, [page])

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (searchTitle && !d.title.toLowerCase().includes(searchTitle.toLowerCase())) return false
      if (statusFilter && d.status !== statusFilter) return false
      if (categoryFilter && String(d.categoryId) !== categoryFilter) return false
      return true
    })
  }, [documents, searchTitle, statusFilter, categoryFilter])

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

  const handleSelectDocument = (id: number, checked: boolean) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(new Set(filtered.map(doc => doc.id)))
    } else {
      setSelectedDocuments(new Set())
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedDocuments.size === 0) return
    if (!confirm(`Delete ${selectedDocuments.size} selected document(s)?`)) return
    setLoading(true)
    try {
      await Promise.all(Array.from(selectedDocuments).map(id => deleteDocument(id)))
      setSelectedDocuments(new Set())
      setPage(0)
      fetchDocuments(0)
    } catch {
      setError('Delete failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSingle = async (id: number) => {
    if (!confirm('Delete this document?')) return
    setLoading(true)
    try {
      await deleteDocument(id)
      setPage(0)
      fetchDocuments(0)
    } catch {
      setError('Delete failed.')
    } finally {
      setLoading(false)
    }
  }

  const resetUpload = () => {
    setUploadFile(null)
    setUploadTitle('')
    setUploadDesc('')
    setUploadCategory('')
    setUploadTags('')
    setUploadVisibility('PRIVATE')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async () => {
    if (!uploadTitle.trim()) {
      setError('Title is required.')
      return
    }
    if (!uploadFile) {
      setError('Please choose a file to upload.')
      return
    }
    if (uploadFile.size === 0) {
      setError('File is empty.')
      return
    }
    setUploading(true)
    try {
      await uploadDocument(uploadFile, {
        title: uploadTitle.trim(),
        description: uploadDesc.trim() || undefined,
        categoryId: uploadCategory ? Number(uploadCategory) : undefined,
        tags: uploadTags ? uploadTags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        visibility: uploadVisibility,
      })
      setShowUpload(false)
      resetUpload()
      setPage(0)
      fetchDocuments(0)
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
          <h1 className="page__title">My Documents</h1>
          <p className="page__subtitle">Files in your personal workspace — private by default, optionally public.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowUpload(true)}>
          <Plus size={18} /> Upload
        </button>
      </div>

      <div className="filters">
        <div className="filters__field filters__field--grow">
          <Search size={16} className="filters__icon" />
          <input
            className="filters__input"
            type="search"
            placeholder="Search by title..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
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
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {selectedDocuments.size > 0 && (
        <div className="bulk-actions">
          <span>{selectedDocuments.size} selected</span>
          <button type="button" className="btn btn--danger" onClick={handleDeleteSelected}>
            <Trash2 size={14} /> Delete Selected
          </button>
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="table__checkbox-cell table__select-all">
                <input
                  className={selectedDocuments.size > 0 ? 'table__select-all-input table__select-all-input--active' : 'table__select-all-input'}
                  type="checkbox"
                  checked={selectedDocuments.size === filtered.length && filtered.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th>Title</th>
              <th>Category</th>
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
                  <td className="table__checkbox-cell" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedDocuments.has(doc.id)}
                      onChange={(e) => handleSelectDocument(doc.id, e.target.checked)}
                    />
                  </td>
                  <td>
                    <div className="table__title">{doc.title}</div>
                    <div className="table__desc">{doc.description}</div>
                  </td>
                  <td>{doc.categoryName ?? '—'}</td>
                  <td>
                    <span className="badge badge--neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {doc.visibility === 'PUBLIC' ? <Globe size={11} /> : <Lock size={11} />}
                      {doc.visibility === 'PUBLIC' ? 'Public' : 'Private'}
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
                  <td 
                    className="table__actions" 
                    style={{display: 'flex', flexDirection: 'row'}}
                     
                    onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn--sm btn--secondary"
                      onClick={(e) => { e.stopPropagation(); handleDownload(doc) }}
                      disabled={downloadId === doc.id}
                    >
                      <Download size={14} />
                      {downloadId === doc.id ? 'Opening…' : 'Download'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--danger table__delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteSingle(doc.id) }}
                    >
                      <Trash2 size={14} />
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

      {showUpload && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Upload to My Documents</h2>
              <button type="button" className="btn btn--icon" onClick={() => !uploading && setShowUpload(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="notice-strip">
                <div
                  style={{display: 'inline-block'}} 
                  className="notice-strip__icon">
                  {uploadVisibility === 'PUBLIC' ? <Globe size={14} /> : <Lock size={14} />}
                </div>
                <div
                  style={{display: 'inline-block'}} 
                  className="notice-strip__text">
                  {uploadVisibility === 'PUBLIC'
                    ? <>This file will be <strong>public</strong> — any signed-in user can discover and download it.</>
                    : <>This file will be <strong>private</strong> to you. You can still share it with specific people later via collaborators.</>}
                </div>
              </div>
              <div className="form-field">
                <label className="form-field__label">Title *</label>
                <input className="form-field__input" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Document title" />
              </div>
              <div className="form-field">
                <label className="form-field__label">Description</label>
                <textarea className="form-field__textarea" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} placeholder="Optional description" rows={3} />
              </div>
              <div className="form-field">
                <label className="form-field__label">Visibility *</label>
                <select className="form-field__input" value={uploadVisibility} onChange={(e) => setUploadVisibility(e.target.value as DocumentVisibility)}>
                  <option value="PRIVATE">Private — only you (+ collaborators)</option>
                  <option value="PUBLIC">Public — any signed-in user</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-field__label">Category</label>
                <select className="form-field__input" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
                  <option value="">No category</option>
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
              <button type="button" className="btn btn--primary" onClick={handleUpload} disabled={uploading || !uploadFile || !uploadTitle.trim()}>
                <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
