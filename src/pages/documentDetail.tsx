import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentDownloadUrl,
  getDocumentVersionDownloadUrl,
  submitDocument,
  approveDocument,
  rejectDocument,
  archiveDocument,
  getDocumentVersions,
  uploadNewVersion,
  rollbackDocument,
  getWorkflowHistory,
  listCollaborators,
  addCollaborator,
  updateCollaboratorPermission,
  removeCollaborator,
  type DocumentItem,
  type DocumentStatus,
  type DocumentVisibility,
  type DocumentVersion,
  type WorkflowHistoryItem,
  type DocumentCollaborator,
  type CollaboratorPermission,
} from '../services/documentService'
import { getCategories, type CategoryItem } from '../services/categoryService'
import { getAuthUser } from '../services/authService'
import {
  ArrowLeft, Download, Trash2, Edit3, Save, X, Upload, RotateCcw,
  Send, CheckCircle, XCircle, Archive, Share2, Lock, Globe, Building2,
  Users as UsersIcon, UserPlus, UserMinus, Eye, FileText, AlertCircle,
} from 'lucide-react'

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

const formatBytes = (bytes: number): string => {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let value = bytes
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

const VisibilityIcon = ({ visibility, size = 12 }: { visibility: DocumentVisibility; size?: number }) => {
  if (visibility === 'PUBLIC') return <Globe size={size} />
  if (visibility === 'PRIVATE') return <Lock size={size} />
  return <Building2 size={size} />
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

  // Share dialog
  const [showShare, setShowShare] = useState(false)
  const [shareTab, setShareTab] = useState<'visibility' | 'people'>('visibility')
  const [shareVisibility, setShareVisibility] = useState<DocumentVisibility>('PRIVATE')
  const [savingVisibility, setSavingVisibility] = useState(false)
  const [collaborators, setCollaborators] = useState<DocumentCollaborator[]>([])
  const [collabLoading, setCollabLoading] = useState(false)
  const [collabEmail, setCollabEmail] = useState('')
  const [collabPermission, setCollabPermission] = useState<CollaboratorPermission>('READ')
  const [addingCollab, setAddingCollab] = useState(false)
  
  // Preview
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFileName, setPreviewFileName] = useState('')
  const [previewFileType, setPreviewFileType] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null)

  const docId = Number(id)
  const isOwner = doc?.createdById === user?.id
  const canEditDoc = isAdmin || isOwner
  const canRollback = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const isPersonalScope = !doc?.organizationId

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
      setShareVisibility(docRes.data.visibility ?? 'PRIVATE')

      setEditTitle(docRes.data.title)
      setEditDesc(docRes.data.description ?? '')
      setEditCategory(docRes.data.categoryId ? String(docRes.data.categoryId) : '')
      setEditTags(docRes.data.tags?.join(', ') ?? '')
    } catch {
      setError('Failed to load document.')
    } finally {
      setLoading(false)
    }
  }

  const fetchCollaborators = async () => {
    setCollabLoading(true)
    try {
      const res = await listCollaborators(docId)
      setCollaborators(res.data ?? [])
    } catch {
      // silent
    } finally {
      setCollabLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [docId])

  useEffect(() => {
    if (showShare && shareTab === 'people') {
      fetchCollaborators()
    }
  }, [showShare, shareTab])

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(null) }
    else { setSuccess(msg); setError(null) }
    setTimeout(() => { setError(null); setSuccess(null) }, 4000)
  }

  const handleSaveEdit = async () => {
    if (!doc) return
    if (!editTitle.trim()) {
      showMsg('Title is required.', true)
      return
    }
    setSaving(true)
    try {
      await updateDocument(docId, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        categoryId: editCategory ? Number(editCategory) : undefined,
        tags: editTags ? editTags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        visibility: doc.visibility,
        organizationId: doc.organizationId ?? undefined,
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
    try {
      const url = await getDocumentDownloadUrl(docId)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      showMsg('Download failed.', true)
    }
  }

  const handleDownloadVersion = async (v: DocumentVersion) => {
    try {
      const url = await getDocumentVersionDownloadUrl(docId, v.versionNumber)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      showMsg('Download failed.', true)
    }
  }

  const handleUploadVersion = async () => {
    if (!versionFile) {
      showMsg('Please choose a file.', true)
      return
    }
    if (!versionComment.trim()) {
      showMsg('Comment is required.', true)
      return
    }
    if (versionFile.size === 0) {
      showMsg('File is empty.', true)
      return
    }
    setUploadingVersion(true)
    try {
      await uploadNewVersion(docId, versionFile, versionComment.trim())
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

  const handleSaveVisibility = async () => {
    if (!doc) return
    setSavingVisibility(true)
    try {
      await updateDocument(docId, {
        title: doc.title,
        description: doc.description ?? undefined,
        categoryId: doc.categoryId ?? undefined,
        tags: doc.tags,
        visibility: shareVisibility,
        organizationId: doc.organizationId ?? undefined,
      })
      showMsg('Visibility updated.')
      fetchAll()
    } catch {
      showMsg('Failed to update visibility.', true)
    } finally {
      setSavingVisibility(false)
    }
  }

  const handleAddCollaborator = async () => {
    if (!collabEmail.trim()) {
      showMsg('Email is required.', true)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collabEmail.trim())) {
      showMsg('Invalid email format.', true)
      return
    }
    setAddingCollab(true)
    try {
      await addCollaborator(docId, {
        email: collabEmail.trim(),
        permission: collabPermission,
      })
      setCollabEmail('')
      setCollabPermission('READ')
      fetchCollaborators()
      showMsg('Collaborator added.')
    } catch {
      showMsg('Failed to add collaborator.', true)
    } finally {
      setAddingCollab(false)
    }
  }

  const handleChangeCollabPerm = async (userId: string, perm: CollaboratorPermission) => {
    try {
      await updateCollaboratorPermission(docId, userId, perm)
      fetchCollaborators()
      showMsg('Permission updated.')
    } catch {
      showMsg('Update failed.', true)
    }
  }

  const handleRemoveCollab = async (userId: string) => {
    if (!confirm('Remove this collaborator?')) return
    try {
      await removeCollaborator(docId, userId)
      fetchCollaborators()
      showMsg('Collaborator removed.')
    } catch {
      showMsg('Remove failed.', true)
    }
  }

  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
    if (ext === 'pdf') return 'pdf'
    if (['txt', 'md', 'json', 'js', 'ts', 'html', 'css', 'sql', 'py', 'java', 'c', 'cpp'].includes(ext)) return 'text'
    return 'other'
  }

  const handlePreview = async (urlFetcher: () => Promise<string>, fileName: string) => {
    setPreviewLoading(true)
    setShowPreview(true)
    setPreviewFileName(fileName)
    setPreviewError(null)
    setPreviewTextContent(null)
    
    const type = getFileType(fileName)
    setPreviewFileType(type)

    try {
      const url = await urlFetcher()
      setPreviewUrl(url)

      if (type === 'text') {
        const res = await fetch(url)
        if (res.ok) {
          const text = await res.text()
          setPreviewTextContent(text)
        } else {
          setPreviewError('Failed to load text content.')
        }
      }
    } catch {
      setPreviewError('Failed to generate preview URL.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handlePreviewLatest = () => handlePreview(() => getDocumentDownloadUrl(docId), doc.title + (versions[0]?.fileName ? '.' + versions[0].fileName.split('.').pop() : ''))
  const handlePreviewVersion = (v: DocumentVersion) => handlePreview(() => getDocumentVersionDownloadUrl(docId, v.versionNumber), v.fileName)

  if (loading) return <div className="page"><p>Loading...</p></div>
  if (!doc) return <div className="page"><p>Document not found.</p></div>

  const canEditMeta = canEditDoc && (doc.status === 'DRAFT' || doc.status === 'REJECTED')

  const visibilityOptions: DocumentVisibility[] = isPersonalScope
    ? ['PRIVATE', 'PUBLIC']
    : ['ORG_INTERNAL', 'ORG_PUBLIC']

  return (
    <div className="page">
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <div className="page__header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="page__title">{doc.title}</h1>
            <span className="badge" style={{
              background: `${statusColors[doc.status] ?? '#e5e7eb'}22`,
              color: statusColors[doc.status] ?? '#374151',
              border: `1px solid ${statusColors[doc.status] ?? '#e5e7eb'}44`,
            }}>
              {doc.status.replace(/_/g, ' ')}
            </span>
            <span className="badge badge--neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <VisibilityIcon visibility={doc.visibility} /> {visibilityLabel[doc.visibility] ?? doc.visibility}
            </span>
          </div>
          <p className="page__subtitle">
            by {doc.createdByName} · v{doc.latestVersion}
            {doc.organizationName ? ` · ${doc.organizationName}` : ' · Personal'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--secondary btn--sm" onClick={handlePreviewLatest}><Eye size={14} /> Preview</button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={handleDownload}><Download size={14} /> Download</button>
          {canEditDoc && (
            <button type="button" className="btn btn--primary btn--sm" onClick={() => { setShareVisibility(doc.visibility); setShowShare(true) }}>
              <Share2 size={14} /> Access
            </button>
          )}
          {canEditMeta && (
            <>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => setEditing(!editing)}>
                <Edit3 size={14} /> {editing ? 'Cancel Edit' : 'Edit'}
              </button>
              <button type="button" className="btn btn--danger btn--sm" onClick={handleDelete}><Trash2 size={14} /> Delete</button>
            </>
          )}
        </div>
      </div>

      <div className="workflow-actions">
        {(doc.status === 'DRAFT' || doc.status === 'REJECTED') && isOwner && (
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
        {canEditDoc && (
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setShowVersionUpload(true)}><Upload size={14} /> New Version</button>
        )}
      </div>

      <div className="tabs">
        {(['detail', 'versions', 'workflow'] as const).map((t) => (
          <button key={t} type="button" className={`tabs__tab ${tab === t ? 'tabs__tab--active' : ''}`} onClick={() => setTab(t)}>
            {t === 'detail' ? 'Details' : t === 'versions' ? `Versions (${versions.length})` : `Workflow (${workflow.length})`}
          </button>
        ))}
      </div>

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
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-field__label">Tags</label>
              <input className="form-field__input" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="tag1, tag2" />
            </div>
            <p className="text-muted text-sm" style={{ margin: '0 0 12px' }}>
              Visibility and collaborators are managed in the <strong>Access</strong> dialog.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn--primary" onClick={handleSaveEdit} disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save'}</button>
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-item__label">Title</span><span>{doc.title}</span></div>
              <div className="detail-item"><span className="detail-item__label">Description</span><span>{doc.description || '—'}</span></div>
              <div className="detail-item"><span className="detail-item__label">Category</span><span>{doc.categoryName || '—'}</span></div>
              <div className="detail-item"><span className="detail-item__label">Visibility</span><span>{visibilityLabel[doc.visibility] ?? doc.visibility}</span></div>
              <div className="detail-item"><span className="detail-item__label">Scope</span><span>{doc.organizationName || 'Personal'}</span></div>
              <div className="detail-item"><span className="detail-item__label">Tags</span><span>{doc.tags?.length ? doc.tags.join(', ') : '—'}</span></div>
              <div className="detail-item"><span className="detail-item__label">Author</span><span>{doc.createdByName}</span></div>
              <div className="detail-item"><span className="detail-item__label">Version</span><span>v{doc.latestVersion}</span></div>
              <div className="detail-item"><span className="detail-item__label">Created</span><span>{new Date(doc.createdAt).toLocaleString()}</span></div>
              <div className="detail-item"><span className="detail-item__label">Updated</span><span>{new Date(doc.updatedAt).toLocaleString()}</span></div>
            </div>
          </div>
        )
      )}

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
                    <th>File</th>
                    <th>Size</th>
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
                      <td>{v.fileName || '—'}</td>
                      <td>{formatBytes(v.fileSize)}</td>
                      <td>{v.comment || '—'}</td>
                      <td>{v.uploadedByName}</td>
                      <td>{new Date(v.createdAt).toLocaleString()}</td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn--sm btn--primary" onClick={() => handlePreviewVersion(v)} title="Preview"><Eye size={14} /></button>
                        <button type="button" className="btn btn--sm btn--secondary" onClick={() => handleDownloadVersion(v)} title="Download"><Download size={14} /></button>
                        {canRollback && (
                          <button type="button" className="btn btn--sm btn--ghost" onClick={() => handleRollback(v)} title="Rollback"><RotateCcw size={14} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
                    <strong>{w.fromStatus || 'START'}</strong> → <strong>{w.toStatus}</strong> by {w.performedByName}
                    {w.comment && <p className="text-muted">{w.comment}</p>}
                    <p className="text-sm text-muted">{new Date(w.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                <label className="form-field__label">Comment *</label>
                <input className="form-field__input" value={versionComment} onChange={(e) => setVersionComment(e.target.value)} placeholder="What changed?" />
              </div>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setShowVersionUpload(false)} disabled={uploadingVersion}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={handleUploadVersion} disabled={uploadingVersion || !versionFile || !versionComment.trim()}>
                <Upload size={16} /> {uploadingVersion ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {showShare && (
        <div className="modal-overlay" onClick={() => setShowShare(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal__header">
              <h2 className="modal__title"><Share2 size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Manage access — {doc.title}</h2>
              <button type="button" className="btn btn--icon" onClick={() => setShowShare(false)}><X size={20} /></button>
            </div>
            <div className="tabs" style={{ margin: 0, padding: '0 26px', borderBottom: '1px solid #e2e8f0' }}>
              <button type="button" className={`tabs__tab ${shareTab === 'visibility' ? 'tabs__tab--active' : ''}`} onClick={() => setShareTab('visibility')}>
                <Globe size={14} /> Link visibility
              </button>
              <button type="button" className={`tabs__tab ${shareTab === 'people' ? 'tabs__tab--active' : ''}`} onClick={() => setShareTab('people')}>
                <UsersIcon size={14} /> People ({collaborators.length})
              </button>
            </div>
            <div className="modal__body">
              {shareTab === 'visibility' && (
                <>
                  <p className="text-muted text-sm" style={{ margin: '0 0 16px' }}>
                    {isPersonalScope
                      ? 'Personal file. Choose who can view via a link.'
                      : `Org file (${doc.organizationName}). Choose internal or public within the org's rules.`}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {visibilityOptions.map((v) => (
                      <label key={v} className={`share-radio ${shareVisibility === v ? 'share-radio--active' : ''}`}>
                        <input
                          type="radio"
                          name="visibility"
                          value={v}
                          checked={shareVisibility === v}
                          onChange={() => setShareVisibility(v)}
                        />
                        <div className="share-radio__icon"><VisibilityIcon visibility={v} size={18} /></div>
                        <div>
                          <div className="share-radio__title">{visibilityLabel[v]}</div>
                          <div className="share-radio__desc">
                            {v === 'PRIVATE' && 'Only you (plus collaborators you invite).'}
                            {v === 'PUBLIC' && 'Any signed-in user can discover and download.'}
                            {v === 'ORG_INTERNAL' && 'Members of this organization only.'}
                            {v === 'ORG_PUBLIC' && "Org members + anyone if the org itself is public."}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={handleSaveVisibility}
                      disabled={savingVisibility || shareVisibility === doc.visibility}
                    >
                      {savingVisibility ? 'Saving...' : 'Save visibility'}
                    </button>
                  </div>
                </>
              )}

              {shareTab === 'people' && (
                <>
                  <p className="text-muted text-sm" style={{ margin: '0 0 14px' }}>
                    Invite specific users regardless of visibility. Works across organizations.
                  </p>
                  <div className="share-add">
                    <input
                      type="email"
                      className="form-field__input"
                      placeholder="email@example.com"
                      value={collabEmail}
                      onChange={(e) => setCollabEmail(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <select
                      className="form-field__input"
                      value={collabPermission}
                      onChange={(e) => setCollabPermission(e.target.value as CollaboratorPermission)}
                      style={{ maxWidth: 140 }}
                    >
                      <option value="READ">Read</option>
                      <option value="WRITE">Write</option>
                    </select>
                    <button type="button" className="btn btn--primary btn--sm" onClick={handleAddCollaborator} disabled={addingCollab || !collabEmail.trim()}>
                      <UserPlus size={14} /> Add
                    </button>
                  </div>

                  <div className="collaborator-list">
                    {collabLoading ? (
                      <p className="text-muted text-sm">Loading...</p>
                    ) : collaborators.length === 0 ? (
                      <p className="text-muted text-sm">No collaborators yet.</p>
                    ) : (
                      collaborators.map((c) => (
                        <div key={c.id} className="collaborator-item">
                          <div className="collaborator-item__avatar">
                            {c.fullName.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="collaborator-item__main">
                            <div className="collaborator-item__name">{c.fullName}</div>
                            <div className="collaborator-item__email">{c.email}</div>
                          </div>
                          <select
                            className="form-field__input"
                            value={c.permission}
                            onChange={(e) => handleChangeCollabPerm(c.userId, e.target.value as CollaboratorPermission)}
                            style={{ padding: '6px 28px 6px 10px', height: 'auto', fontSize: '0.82rem', width: 110 }}
                          >
                            <option value="READ">Read</option>
                            <option value="WRITE">Write</option>
                          </select>
                          <button
                            type="button"
                            className="btn btn--sm btn--ghost"
                            onClick={() => handleRemoveCollab(c.userId)}
                            title="Remove"
                          >
                            <UserMinus size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal modal--preview" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Eye size={18} /> Preview: {previewFileName}
              </h2>
              <button type="button" className="btn btn--icon" onClick={() => setShowPreview(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="preview-container">
                {previewLoading && (
                  <div className="preview-loading">
                    <div className="loader"></div>
                  </div>
                )}
                
                {previewError ? (
                  <div className="preview-error">
                    <AlertCircle size={48} color="#ef4444" />
                    <p>{previewError}</p>
                    <button className="btn btn--secondary btn--sm" onClick={() => setShowPreview(false)}>Close</button>
                  </div>
                ) : (
                  <>
                    {previewFileType === 'image' && previewUrl && (
                      <img src={previewUrl} alt={previewFileName} className="preview-image" />
                    )}
                    
                    {previewFileType === 'pdf' && previewUrl && (
                      <iframe src={`${previewUrl}#toolbar=0`} className="preview-frame" title={previewFileName} />
                    )}
                    
                    {previewFileType === 'text' && (
                      <pre className="preview-text">{previewTextContent}</pre>
                    )}
                    
                    {previewFileType === 'other' && (
                      <div className="preview-error">
                        <FileText size={48} />
                        <p>No preview available for this file type.</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn--primary btn--sm" onClick={() => {
                            if (previewUrl) window.open(previewUrl, '_blank')
                          }}>Download to view</button>
                          <button className="btn btn--ghost btn--sm" onClick={() => setShowPreview(false)}>Close</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
