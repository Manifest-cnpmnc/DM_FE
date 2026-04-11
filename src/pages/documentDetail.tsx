import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getDocumentById,
  updateDocument,
  deleteDocument,
  downloadDocument,
  downloadDocumentVersion,
  submitDocument,
  approveDocument,
  rejectDocument,
  archiveDocument,
  getDocumentVersions,
  uploadNewVersion,
  rollbackDocument,
  getWorkflowHistory,
  type DocumentItem,
  type DocumentVersion,
  type WorkflowHistoryItem,
} from '../services/documentService'
import { getCategories, type CategoryItem } from '../services/categoryService'
import { getAuthUser } from '../services/authService'
import { ArrowLeft, Download, Trash2, Edit3, Save, X, Upload, RotateCcw, Send, CheckCircle, XCircle, Archive } from 'lucide-react'

const statusColors: Record<string, string> = {
  DRAFT: '#f59e0b',
  PENDING_REVIEW: '#6366f1',
  APPROVED: '#16a34a',
  REJECTED: '#dc2626',
  ARCHIVED: '#6b7280',
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = getAuthUser()
  const isAdmin = user?.role === 'ADMIN'

  const [doc, setDoc] = useState<DocumentItem | null>(null)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [workflow, setWorkflow] = useState<WorkflowHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tab, setTab] = useState<'detail' | 'versions' | 'workflow'>('detail')

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editTags, setEditTags] = useState('')
  const [saving, setSaving] = useState(false)

  // Upload version
  const [showVersionUpload, setShowVersionUpload] = useState(false)
  const [versionFile, setVersionFile] = useState<File | null>(null)
  const [versionComment, setVersionComment] = useState('')
  const [uploadingVersion, setUploadingVersion] = useState(false)
  const versionFileRef = useRef<HTMLInputElement>(null)

  // Workflow comment
  const [showWorkflowModal, setShowWorkflowModal] = useState<string | null>(null)
  const [workflowComment, setWorkflowComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const docId = Number(id)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [docRes, catRes, verRes, wfRes] = await Promise.all([
        getDocumentById(docId),
        getCategories(),
        getDocumentVersions(docId).catch(() => ({ data: [] as DocumentVersion[] })),
        getWorkflowHistory(docId).catch(() => ({ data: [] as WorkflowHistoryItem[] })),
      ])
      setDoc(docRes.data)
      setCategories(catRes.data)
      setVersions(verRes.data)
      setWorkflow(wfRes.data)
      // Init edit fields
      setEditTitle(docRes.data.title)
      setEditDesc(docRes.data.description ?? '')
      setEditCategory(String(docRes.data.categoryId))
      setEditTags(docRes.data.tags?.join(', ') ?? '')
    } catch {
      setError('Failed to load document.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [docId])

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(null) }
    else { setSuccess(msg); setError(null) }
    setTimeout(() => { setError(null); setSuccess(null) }, 4000)
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editCategory) return
    setSaving(true)
    try {
      await updateDocument(docId, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        categoryId: Number(editCategory),
        tags: editTags ? editTags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      })
      setEditing(false)
      showMsg('Document updated.')
      fetchAll()
    } catch {
      showMsg('Update failed.', true)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      await deleteDocument(docId)
      navigate('/documents')
    } catch {
      showMsg('Delete failed.', true)
    }
  }

  const handleDownload = async () => {
    if (!doc) return
    try {
      const blob = await downloadDocument(docId)
      const ext = doc.latestFileUrl?.split('.').pop() || 'bin'
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${doc.title}.${ext}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)
    } catch {
      showMsg('Download failed.', true)
    }
  }

  const handleDownloadVersion = async (v: DocumentVersion) => {
    try {
      const blob = await downloadDocumentVersion(docId, v.versionNumber)
      const ext = v.fileUrl?.split('.').pop() || 'bin'
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${doc?.title ?? 'doc'}-v${v.versionNumber}.${ext}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)
    } catch {
      showMsg('Download failed.', true)
    }
  }

  const handleUploadVersion = async () => {
    if (!versionFile) return
    setUploadingVersion(true)
    try {
      await uploadNewVersion(docId, versionFile, versionComment || undefined)
      setShowVersionUpload(false)
      setVersionFile(null)
      setVersionComment('')
      showMsg('New version uploaded.')
      fetchAll()
    } catch {
      showMsg('Version upload failed.', true)
    } finally {
      setUploadingVersion(false)
    }
  }

  const handleRollback = async (v: DocumentVersion) => {
    const reason = prompt('Reason for rollback:')
    if (reason === null) return
    try {
      await rollbackDocument(docId, v.versionNumber, reason || undefined)
      showMsg(`Rolled back to v${v.versionNumber}.`)
      fetchAll()
    } catch {
      showMsg('Rollback failed.', true)
    }
  }

  const handleWorkflowAction = async () => {
    if (!showWorkflowModal) return
    setActionLoading(true)
    try {
      const actions: Record<string, (id: number, c?: string) => Promise<unknown>> = {
        submit: submitDocument,
        approve: approveDocument,
        reject: rejectDocument,
        archive: archiveDocument,
      }
      await actions[showWorkflowModal](docId, workflowComment || undefined)
      setShowWorkflowModal(null)
      setWorkflowComment('')
      showMsg(`Document ${showWorkflowModal}ed successfully.`)
      fetchAll()
    } catch {
      showMsg(`${showWorkflowModal} failed.`, true)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="page"><p>Loading...</p></div>
  if (!doc) return <div className="page"><p>Document not found.</p></div>

  const canEdit = doc.status === 'DRAFT' || doc.status === 'REJECTED'

  return (
    <div className="page">
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/documents')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back to Documents
      </button>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      {/* Header */}
      <div className="page__header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page__title">{doc.title}</h1>
            <span className="badge" style={{
              background: `${statusColors[doc.status] ?? '#e5e7eb'}22`,
              color: statusColors[doc.status] ?? '#374151',
              border: `1px solid ${statusColors[doc.status] ?? '#e5e7eb'}44`,
            }}>
              {doc.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="page__subtitle">by {doc.createdByName} | v{doc.latestVersion}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--secondary btn--sm" onClick={handleDownload}><Download size={14} /> Download</button>
          {canEdit && (
            <>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => setEditing(!editing)}>
                <Edit3 size={14} /> {editing ? 'Cancel Edit' : 'Edit'}
              </button>
              <button type="button" className="btn btn--danger btn--sm" onClick={handleDelete}><Trash2 size={14} /> Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Workflow actions */}
      <div className="workflow-actions">
        {(doc.status === 'DRAFT' || doc.status === 'REJECTED') && (
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setShowWorkflowModal('submit')}><Send size={14} /> Submit for Review</button>
        )}
        {doc.status === 'PENDING_REVIEW' && isAdmin && (
          <>
            <button type="button" className="btn btn--success btn--sm" onClick={() => setShowWorkflowModal('approve')}><CheckCircle size={14} /> Approve</button>
            <button type="button" className="btn btn--danger btn--sm" onClick={() => setShowWorkflowModal('reject')}><XCircle size={14} /> Reject</button>
          </>
        )}
        {doc.status === 'APPROVED' && isAdmin && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowWorkflowModal('archive')}><Archive size={14} /> Archive</button>
        )}
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setShowVersionUpload(true)}><Upload size={14} /> New Version</button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(['detail', 'versions', 'workflow'] as const).map((t) => (
          <button key={t} type="button" className={`tabs__tab ${tab === t ? 'tabs__tab--active' : ''}`} onClick={() => setTab(t)}>
            {t === 'detail' ? 'Details' : t === 'versions' ? `Versions (${versions.length})` : `Workflow (${workflow.length})`}
          </button>
        ))}
      </div>

      {/* Detail tab */}
      {tab === 'detail' && (
        editing ? (
          <div className="card">
            <div className="form-field">
              <label className="form-field__label">Title</label>
              <input className="form-field__input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-field__label">Description</label>
              <textarea className="form-field__textarea" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} />
            </div>
            <div className="form-field">
              <label className="form-field__label">Category</label>
              <select className="form-field__input" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                <option value="">Select</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-field__label">Tags</label>
              <input className="form-field__input" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="tag1, tag2" />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" className="btn btn--primary" onClick={handleSaveEdit} disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save'}</button>
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-item__label">Title</span><span>{doc.title}</span></div>
              <div className="detail-item"><span className="detail-item__label">Description</span><span>{doc.description || '—'}</span></div>
              <div className="detail-item"><span className="detail-item__label">Category</span><span>{doc.categoryName}</span></div>
              <div className="detail-item"><span className="detail-item__label">Tags</span><span>{doc.tags?.length ? doc.tags.join(', ') : '—'}</span></div>
              <div className="detail-item"><span className="detail-item__label">Author</span><span>{doc.createdByName}</span></div>
              <div className="detail-item"><span className="detail-item__label">Version</span><span>v{doc.latestVersion}</span></div>
              <div className="detail-item"><span className="detail-item__label">Created</span><span>{new Date(doc.createdAt).toLocaleString()}</span></div>
              <div className="detail-item"><span className="detail-item__label">Updated</span><span>{new Date(doc.updatedAt).toLocaleString()}</span></div>
            </div>
          </div>
        )
      )}

      {/* Versions tab */}
      {tab === 'versions' && (
        <div className="card">
          {versions.length === 0 ? (
            <p className="text-muted">No versions available.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Comment</th>
                    <th>Uploaded by</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => (
                    <tr key={v.id}>
                      <td><span className="badge">v{v.versionNumber}</span></td>
                      <td>{v.comment || '—'}</td>
                      <td>{v.createdByName}</td>
                      <td>{new Date(v.createdAt).toLocaleString()}</td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn--sm btn--secondary" onClick={() => handleDownloadVersion(v)}><Download size={14} /></button>
                        <button type="button" className="btn btn--sm btn--ghost" onClick={() => handleRollback(v)}><RotateCcw size={14} /> Rollback</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Workflow tab */}
      {tab === 'workflow' && (
        <div className="card">
          {workflow.length === 0 ? (
            <p className="text-muted">No workflow history.</p>
          ) : (
            <div className="timeline">
              {workflow.map((w) => (
                <div key={w.id} className="timeline__item">
                  <div className="timeline__dot" />
                  <div className="timeline__content">
                    <strong>{w.action}</strong> by {w.performedByName}
                    {w.comment && <p className="text-muted">{w.comment}</p>}
                    <p className="text-sm text-muted">{new Date(w.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Version Modal */}
      {showVersionUpload && (
        <div className="modal-overlay" onClick={() => !uploadingVersion && setShowVersionUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Upload New Version</h2>
              <button type="button" className="btn btn--icon" onClick={() => setShowVersionUpload(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="form-field">
                <label className="form-field__label">File *</label>
                <input ref={versionFileRef} type="file" className="form-field__input" onChange={(e) => setVersionFile(e.target.files?.[0] ?? null)} />
              </div>
              <div className="form-field">
                <label className="form-field__label">Comment</label>
                <input className="form-field__input" value={versionComment} onChange={(e) => setVersionComment(e.target.value)} placeholder="What changed?" />
              </div>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setShowVersionUpload(false)} disabled={uploadingVersion}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={handleUploadVersion} disabled={uploadingVersion || !versionFile}>
                <Upload size={16} /> {uploadingVersion ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Action Modal */}
      {showWorkflowModal && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowWorkflowModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title" style={{ textTransform: 'capitalize' }}>{showWorkflowModal} Document</h2>
              <button type="button" className="btn btn--icon" onClick={() => setShowWorkflowModal(null)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="form-field">
                <label className="form-field__label">Comment</label>
                <textarea className="form-field__textarea" value={workflowComment} onChange={(e) => setWorkflowComment(e.target.value)} placeholder="Add a comment..." rows={3} />
              </div>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setShowWorkflowModal(null)} disabled={actionLoading}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={handleWorkflowAction} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : `Confirm ${showWorkflowModal}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
