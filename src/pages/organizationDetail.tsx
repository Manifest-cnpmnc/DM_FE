import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getOrganization,
  updateOrganization,
  deleteOrganization,
  listOrganizationMembers,
  addOrganizationMember,
  updateOrganizationMemberRole,
  removeOrganizationMember,
  transferOrganizationOwnership,
  type OrganizationItem,
  type OrganizationMember,
  type OrgRole,
  type OrgVisibility,
} from '../services/organizationService'
import {
  getOrganizationDocuments,
  getDocumentDownloadUrl,
  uploadDocument,
  type DocumentItem,
  type DocumentStatus,
  type DocumentVisibility,
} from '../services/documentService'
import { getCategories, type CategoryItem } from '../services/categoryService'
import { getAuthUser } from '../services/authService'
import {
  ArrowLeft, Building2, Edit3, Save, Trash2, UserPlus, X,
  FileText, Users as UsersIcon, Settings, Plus, Upload, Download, Globe, Lock, Search,
  Crown,
} from 'lucide-react'

type TabKey = 'overview' | 'documents' | 'members' | 'settings'

const orgRoles: OrgRole[] = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']

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
  ORG_INTERNAL: 'Internal',
  ORG_PUBLIC: 'Public',
}

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = getAuthUser()
  const isSystemAdmin = user?.role === 'ADMIN'

  const [tab, setTab] = useState<TabKey>('overview')
  const [org, setOrg] = useState<OrganizationItem | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Documents tab
  const [docs, setDocs] = useState<DocumentItem[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [docsPage, setDocsPage] = useState(0)
  const [docsTotalPages, setDocsTotalPages] = useState(0)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [docSearch, setDocSearch] = useState('')
  const [docStatus, setDocStatus] = useState('')
  const [downloadId, setDownloadId] = useState<number | null>(null)

  // Upload modal
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadCategory, setUploadCategory] = useState('')
  const [uploadTags, setUploadTags] = useState('')
  const [uploadVisibility, setUploadVisibility] = useState<DocumentVisibility>('ORG_INTERNAL')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Settings (edit)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editVisibility, setEditVisibility] = useState<OrgVisibility>('PRIVATE')
  const [saving, setSaving] = useState(false)

  // Add member
  const [showAdd, setShowAdd] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState<OrgRole>('VIEWER')
  const [adding, setAdding] = useState(false)

  // Transfer ownership
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferTarget, setTransferTarget] = useState('')
  const [transferring, setTransferring] = useState(false)

  const myMembership = members.find((m) => m.userId === user?.id)
  const myOrgRole = myMembership?.orgRole
  const canManageMembers = isSystemAdmin || myOrgRole === 'ADMIN' || myOrgRole === 'OWNER'
  const canChangeRoles = isSystemAdmin || myOrgRole === 'OWNER'
  const canEditOrg = isSystemAdmin || myOrgRole === 'ADMIN' || myOrgRole === 'OWNER'
  const canDeleteOrg = isSystemAdmin || myOrgRole === 'OWNER'
  const canTransferOwnership = isSystemAdmin || myOrgRole === 'OWNER'
  const canUpload =
    isSystemAdmin ||
    myOrgRole === 'EDITOR' ||
    myOrgRole === 'ADMIN' ||
    myOrgRole === 'OWNER'

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(null) }
    else { setSuccess(msg); setError(null) }
    setTimeout(() => { setError(null); setSuccess(null) }, 4000)
  }

  const fetchCore = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [orgRes, memRes] = await Promise.all([
        getOrganization(id),
        listOrganizationMembers(id).catch(() => ({ data: [] as OrganizationMember[] })),
      ])
      setOrg(orgRes.data)
      setMembers(memRes.data)
      setEditName(orgRes.data.name)
      setEditDesc(orgRes.data.description ?? '')
      setEditVisibility(orgRes.data.visibility)
    } catch {
      setError('Failed to load organization.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocs = async (p = 0) => {
    if (!id) return
    setDocsLoading(true)
    try {
      const res = await getOrganizationDocuments(id, { page: p, size: 20 })
      setDocs(res.data.content)
      setDocsTotalPages(res.data.totalPages)
    } catch {
      setError('Failed to load documents.')
    } finally {
      setDocsLoading(false)
    }
  }

  useEffect(() => { fetchCore() }, [id])

  useEffect(() => {
    if (tab === 'documents') {
      fetchDocs(docsPage)
      if (categories.length === 0) {
        getCategories().then((r) => setCategories(r.data)).catch(() => undefined)
      }
    }
  }, [tab, id, docsPage])

  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      if (docSearch && !d.title.toLowerCase().includes(docSearch.toLowerCase())) return false
      if (docStatus && d.status !== docStatus) return false
      return true
    })
  }, [docs, docSearch, docStatus])

  const handleSaveOrg = async () => {
    if (!id) return
    if (!editName.trim()) {
      showMsg('Name is required.', true)
      return
    }
    setSaving(true)
    try {
      await updateOrganization(id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        visibility: editVisibility,
      })
      showMsg('Organization updated.')
      fetchCore()
    } catch {
      showMsg('Update failed.', true)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOrg = async () => {
    if (!id || !confirm('Delete this organization? This cannot be undone.')) return
    try {
      await deleteOrganization(id)
      navigate('/organizations')
    } catch {
      showMsg('Delete failed.', true)
    }
  }

  const handleAddMember = async () => {
    if (!id) return
    if (!addEmail.trim()) {
      showMsg('Email is required.', true)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addEmail.trim())) {
      showMsg('Invalid email format.', true)
      return
    }
    setAdding(true)
    try {
      await addOrganizationMember(id, { email: addEmail.trim(), orgRole: addRole })
      setShowAdd(false)
      setAddEmail('')
      setAddRole('VIEWER')
      showMsg('Member added.')
      fetchCore()
    } catch {
      showMsg('Failed to add member.', true)
    } finally {
      setAdding(false)
    }
  }

  const handleRoleChange = async (userId: string, role: OrgRole) => {
    if (!id) return
    try {
      await updateOrganizationMemberRole(id, userId, role)
      showMsg('Role updated.')
      fetchCore()
    } catch {
      showMsg('Role update failed.', true)
    }
  }

  const handleRemove = async (userId: string) => {
    if (!id || !confirm('Remove this member?')) return
    try {
      await removeOrganizationMember(id, userId)
      showMsg('Member removed.')
      fetchCore()
    } catch {
      showMsg('Remove failed.', true)
    }
  }

  const handleTransferOwnership = async () => {
    if (!id) return
    if (!transferTarget) {
      showMsg('Please select a member to transfer ownership to.', true)
      return
    }
    if (!confirm('Transfer ownership? You will become ADMIN of this organization, not OWNER.')) return
    setTransferring(true)
    try {
      await transferOrganizationOwnership(id, transferTarget)
      setShowTransfer(false)
      setTransferTarget('')
      showMsg('Ownership transferred.')
      fetchCore()
    } catch {
      showMsg('Transfer failed.', true)
    } finally {
      setTransferring(false)
    }
  }

  const handleDownload = async (doc: DocumentItem) => {
    setDownloadId(doc.id)
    try {
      const url = await getDocumentDownloadUrl(doc.id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      showMsg('Download failed.', true)
    } finally {
      setDownloadId(null)
    }
  }

  const resetUpload = () => {
    setUploadFile(null)
    setUploadTitle('')
    setUploadDesc('')
    setUploadCategory('')
    setUploadTags('')
    setUploadVisibility('ORG_INTERNAL')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async () => {
    if (!id) return
    if (!uploadTitle.trim()) {
      showMsg('Title is required.', true)
      return
    }
    if (!uploadFile) {
      showMsg('Please choose a file to upload.', true)
      return
    }
    if (uploadFile.size === 0) {
      showMsg('File is empty.', true)
      return
    }
    setUploading(true)
    try {
      await uploadDocument(uploadFile, {
        title: uploadTitle.trim(),
        description: uploadDesc.trim() || undefined,
        categoryId: uploadCategory ? Number(uploadCategory) : undefined,
        tags: uploadTags ? uploadTags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        organizationId: id,
        visibility: uploadVisibility,
      })
      setShowUpload(false)
      resetUpload()
      setDocsPage(0)
      fetchDocs(0)
      showMsg('Document uploaded.')
    } catch {
      showMsg('Upload failed.', true)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="page"><p>Loading...</p></div>
  if (!org) return <div className="page"><p>Organization not found.</p></div>

  const VisibilityIcon = org.visibility === 'PUBLIC' ? Globe : Lock

  return (
    <div className="page">
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/organizations')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back to Organizations
      </button>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <div className="org-header">
        <div className="org-header__icon"><Building2 size={28} /></div>
        <div className="org-header__main">
          <div className="org-header__title-row">
            <h1 className="page__title" style={{ margin: 0 }}>{org.name}</h1>
            <span className="badge badge--neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <VisibilityIcon size={12} /> {org.visibility}
            </span>
          </div>
          <p className="page__subtitle" style={{ margin: '4px 0 0' }}>
            <code>{org.slug}</code> · Owner: {org.ownerName}
            {myOrgRole ? <> · You: <strong>{myOrgRole}</strong></> : isSystemAdmin ? <> · You: <strong>SYSTEM ADMIN</strong></> : null}
          </p>
          {org.description && <p style={{ margin: '8px 0 0', color: '#475569' }}>{org.description}</p>}
        </div>
      </div>

      <div className="tabs">
        <button type="button" className={`tabs__tab ${tab === 'overview' ? 'tabs__tab--active' : ''}`} onClick={() => setTab('overview')}>
          <Building2 size={14} /> Overview
        </button>
        <button type="button" className={`tabs__tab ${tab === 'documents' ? 'tabs__tab--active' : ''}`} onClick={() => setTab('documents')}>
          <FileText size={14} /> Documents
        </button>
        <button type="button" className={`tabs__tab ${tab === 'members' ? 'tabs__tab--active' : ''}`} onClick={() => setTab('members')}>
          <UsersIcon size={14} /> Members ({members.length})
        </button>
        {canEditOrg && (
          <button type="button" className={`tabs__tab ${tab === 'settings' ? 'tabs__tab--active' : ''}`} onClick={() => setTab('settings')}>
            <Settings size={14} /> Settings
          </button>
        )}
      </div>

      {tab === 'overview' && (
        <div className="card">
          <div className="detail-grid">
            <div className="detail-item"><span className="detail-item__label">Name</span><span>{org.name}</span></div>
            <div className="detail-item"><span className="detail-item__label">Slug</span><span><code>{org.slug}</code></span></div>
            <div className="detail-item"><span className="detail-item__label">Description</span><span>{org.description || '—'}</span></div>
            <div className="detail-item"><span className="detail-item__label">Visibility</span><span>{org.visibility}</span></div>
            <div className="detail-item"><span className="detail-item__label">Owner</span><span>{org.ownerName}</span></div>
            <div className="detail-item"><span className="detail-item__label">Members</span><span>{members.length}</span></div>
            <div className="detail-item"><span className="detail-item__label">Created</span><span>{new Date(org.createdAt).toLocaleString()}</span></div>
            <div className="detail-item"><span className="detail-item__label">Updated</span><span>{new Date(org.updatedAt).toLocaleString()}</span></div>
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <div>
          <div className="filters">
            <div className="filters__field filters__field--grow">
              <Search size={16} className="filters__icon" />
              <input
                className="filters__input"
                type="search"
                placeholder="Search by title..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
              />
            </div>
            <select className="filters__select" value={docStatus} onChange={(e) => setDocStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            {canUpload && (
              <button type="button" className="btn btn--primary" onClick={() => setShowUpload(true)}>
                <Plus size={16} /> Upload
              </button>
            )}
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Visibility</th>
                  <th>Status</th>
                  <th>Author</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docsLoading ? (
                  <tr><td colSpan={7} className="table__empty">Loading...</td></tr>
                ) : filteredDocs.length === 0 ? (
                  <tr><td colSpan={7} className="table__empty">No documents in this organization yet.</td></tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="table__row--clickable" onClick={() => navigate(`/documents/${doc.id}`)}>
                      <td>
                        <div className="table__title">{doc.title}</div>
                        <div className="table__desc">{doc.description}</div>
                      </td>
                      <td>{doc.categoryName ?? '—'}</td>
                      <td><span className="badge badge--neutral">{visibilityLabel[doc.visibility] ?? doc.visibility}</span></td>
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
                          {downloadId === doc.id ? 'Opening…' : 'Download'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {docsTotalPages > 1 && (
            <div className="pagination">
              <button type="button" className="btn btn--sm btn--ghost" disabled={docsPage === 0} onClick={() => setDocsPage(docsPage - 1)}>Previous</button>
              <span className="pagination__info">Page {docsPage + 1} / {docsTotalPages}</span>
              <button type="button" className="btn btn--sm btn--ghost" disabled={docsPage >= docsTotalPages - 1} onClick={() => setDocsPage(docsPage + 1)}>Next</button>
            </div>
          )}
        </div>
      )}

      {tab === 'members' && (
        <div>
          {canManageMembers && (
            <div style={{ marginBottom: 16 }}>
              <button type="button" className="btn btn--primary btn--sm" onClick={() => setShowAdd(true)}>
                <UserPlus size={14} /> Add Member
              </button>
            </div>
          )}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  {canManageMembers && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={canManageMembers ? 5 : 4} className="table__empty">No members yet.</td></tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id}>
                      <td className="table__title">{m.fullName}</td>
                      <td>{m.email}</td>
                      <td>
                        {canChangeRoles && m.orgRole !== 'OWNER' ? (
                          <select
                            className="form-field__input"
                            value={m.orgRole}
                            onChange={(e) => handleRoleChange(m.userId, e.target.value as OrgRole)}
                            style={{ padding: '6px 10px', height: 'auto', fontSize: '0.85rem' }}
                          >
                            {orgRoles.filter((r) => r !== 'OWNER').map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span className="badge badge--neutral">{m.orgRole}</span>
                        )}
                      </td>
                      <td>{new Date(m.joinedAt).toLocaleDateString()}</td>
                      {canManageMembers && (
                        <td>
                          {m.orgRole !== 'OWNER' && (
                            <button type="button" className="btn btn--sm btn--danger" onClick={() => handleRemove(m.userId)}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'settings' && canEditOrg && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}><Edit3 size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Organization settings</h3>
          <div className="form-field">
            <label className="form-field__label">Name</label>
            <input className="form-field__input" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-field__label">Description</label>
            <textarea className="form-field__textarea" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} />
          </div>
          <div className="form-field">
            <label className="form-field__label">Visibility</label>
            <select className="form-field__input" value={editVisibility} onChange={(e) => setEditVisibility(e.target.value as OrgVisibility)}>
              <option value="PRIVATE">Private (invite only)</option>
              <option value="PUBLIC">Public (discoverable)</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="button" className="btn btn--primary" onClick={handleSaveOrg} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {canTransferOwnership && (
            <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--color-border-soft)' }}>
              <h4 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Crown size={16} /> Transfer ownership
              </h4>
              <p className="text-muted text-sm" style={{ margin: '0 0 12px' }}>
                Pass the OWNER role to an existing member. You will become ADMIN of this organization.
              </p>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => { setTransferTarget(''); setShowTransfer(true) }}>
                <Crown size={14} /> Transfer Ownership
              </button>
            </div>
          )}

          {canDeleteOrg && (
            <div className="danger-zone">
              <h4 style={{ margin: '0 0 8px', color: '#b91c1c' }}>Danger zone</h4>
              <p className="text-muted" style={{ margin: '0 0 12px' }}>
                Deleting this organization removes it and all memberships. Documents are retained but become inaccessible to members.
              </p>
              <button type="button" className="btn btn--danger btn--sm" onClick={handleDeleteOrg}>
                <Trash2 size={14} /> Delete Organization
              </button>
            </div>
          )}
        </div>
      )}

      {showTransfer && (
        <div className="modal-overlay" onClick={() => !transferring && setShowTransfer(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title"><Crown size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Transfer Ownership</h2>
              <button type="button" className="btn btn--icon" onClick={() => setShowTransfer(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="notice-strip">
                <Crown size={14} /> The target member will become the new <strong>OWNER</strong>. You become <strong>ADMIN</strong>.
              </div>
              <div className="form-field">
                <label className="form-field__label">New owner *</label>
                <select className="form-field__input" value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)}>
                  <option value="">Select a member</option>
                  {members.filter((m) => m.orgRole !== 'OWNER').map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.fullName} ({m.email}) — {m.orgRole}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setShowTransfer(false)} disabled={transferring}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={handleTransferOwnership} disabled={transferring || !transferTarget}>
                <Crown size={16} /> {transferring ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Upload to {org.name}</h2>
              <button type="button" className="btn btn--icon" onClick={() => setShowUpload(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="notice-strip">
                <Building2 size={14} /> This file will be uploaded to <strong>{org.name}</strong>.
              </div>
              <div className="form-field">
                <label className="form-field__label">Title *</label>
                <input className="form-field__input" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Document title" />
              </div>
              <div className="form-field">
                <label className="form-field__label">Description</label>
                <textarea className="form-field__textarea" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} rows={3} />
              </div>
              <div className="form-field">
                <label className="form-field__label">Category</label>
                <select className="form-field__input" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-field__label">Visibility *</label>
                <select className="form-field__input" value={uploadVisibility} onChange={(e) => setUploadVisibility(e.target.value as DocumentVisibility)}>
                  <option value="ORG_INTERNAL">Internal — members only</option>
                  <option value="ORG_PUBLIC">Public — anyone (if org is public)</option>
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

      {showAdd && (
        <div className="modal-overlay" onClick={() => !adding && setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Add Member</h2>
              <button type="button" className="btn btn--icon" onClick={() => setShowAdd(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="form-field">
                <label className="form-field__label">Email *</label>
                <input className="form-field__input" type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="user@example.com" />
              </div>
              <div className="form-field">
                <label className="form-field__label">Role *</label>
                <select className="form-field__input" value={addRole} onChange={(e) => setAddRole(e.target.value as OrgRole)}>
                  {orgRoles.filter((r) => r !== 'OWNER').map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setShowAdd(false)} disabled={adding}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={handleAddMember} disabled={adding || !addEmail.trim()}>
                <UserPlus size={16} /> {adding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
