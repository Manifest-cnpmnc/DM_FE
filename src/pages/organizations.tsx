import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listAllOrganizations,
  listMyOrganizations,
  listPublicOrganizations,
  createOrganization,
  type OrganizationItem,
  type OrgVisibility,
} from '../services/organizationService'
import { getAuthUser } from '../services/authService'
import { Building2, Plus, X, Save } from 'lucide-react'

type OrgTab = 'my' | 'public' | 'all'

export default function OrganizationsPage() {
  const navigate = useNavigate()
  const user = getAuthUser()
  const isAdmin = user?.role === 'ADMIN'
  const canCreate = isAdmin || user?.role === 'MANAGER'

  const [tab, setTab] = useState<OrgTab>('my')
  const [orgs, setOrgs] = useState<OrganizationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [showCreate, setShowCreate] = useState(false)
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formVisibility, setFormVisibility] = useState<OrgVisibility>('PRIVATE')
  const [saving, setSaving] = useState(false)

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(null) }
    else { setSuccess(msg); setError(null) }
    setTimeout(() => { setError(null); setSuccess(null) }, 4000)
  }

  const fetchOrgs = async (p = 0) => {
    setLoading(true)
    setError(null)
    try {
      let res
      if (tab === 'all') res = await listAllOrganizations({ page: p, size: 20 })
      else if (tab === 'public') res = await listPublicOrganizations({ page: p, size: 20 })
      else res = await listMyOrganizations({ page: p, size: 20 })
      setOrgs(res.data.content)
      setTotalPages(res.data.totalPages)
    } catch {
      setError('Failed to load organizations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(0)
    fetchOrgs(0)
  }, [tab])

  useEffect(() => {
    fetchOrgs(page)
  }, [page])

  const handleCreate = async () => {
    if (!formName.trim() || !formSlug.trim()) return
    if (!/^[a-z0-9-]+$/.test(formSlug)) {
      showMsg('Slug must be lowercase letters, numbers, and hyphens only.', true)
      return
    }
    setSaving(true)
    try {
      await createOrganization({
        name: formName.trim(),
        slug: formSlug.trim(),
        description: formDesc.trim() || undefined,
        visibility: formVisibility,
      })
      showMsg('Organization created.')
      setShowCreate(false)
      setFormName('')
      setFormSlug('')
      setFormDesc('')
      setFormVisibility('PRIVATE')
      fetchOrgs(0)
      setPage(0)
    } catch {
      showMsg('Create failed.', true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Organizations</h1>
          <p className="page__subtitle">Workspaces for sharing documents with members.</p>
        </div>
        {canCreate && (
          <button type="button" className="btn btn--primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> New Organization
          </button>
        )}
      </div>

      <div className="tabs">
        <button type="button" className={`tabs__tab ${tab === 'my' ? 'tabs__tab--active' : ''}`} onClick={() => setTab('my')}>My Organizations</button>
        <button type="button" className={`tabs__tab ${tab === 'public' ? 'tabs__tab--active' : ''}`} onClick={() => setTab('public')}>Public</button>
        {isAdmin && (
          <button type="button" className={`tabs__tab ${tab === 'all' ? 'tabs__tab--active' : ''}`} onClick={() => setTab('all')}>All (Admin)</button>
        )}
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Visibility</th>
              <th>Owner</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="table__empty">Loading...</td></tr>
            ) : orgs.length === 0 ? (
              <tr><td colSpan={6} className="table__empty">No organizations found.</td></tr>
            ) : (
              orgs.map((o) => (
                <tr key={o.id} className="table__row--clickable" onClick={() => navigate(`/organizations/${o.id}`)}>
                  <td>
                    <div className="table__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={16} /> {o.name}
                    </div>
                    <div className="table__desc">{o.description}</div>
                  </td>
                  <td><code>{o.slug}</code></td>
                  <td><span className="badge badge--neutral">{o.visibility}</span></td>
                  <td>{o.ownerName}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button type="button" className="btn btn--sm btn--secondary" onClick={(e) => { e.stopPropagation(); navigate(`/organizations/${o.id}`) }}>
                      Open
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

      {showCreate && (
        <div className="modal-overlay" onClick={() => !saving && setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">New Organization</h2>
              <button type="button" className="btn btn--icon" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="form-field">
                <label className="form-field__label">Name *</label>
                <input className="form-field__input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Acme Corporation" />
              </div>
              <div className="form-field">
                <label className="form-field__label">Slug *</label>
                <input className="form-field__input" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="acme-corp" />
                <p className="text-sm text-muted">Lowercase letters, numbers, and hyphens only.</p>
              </div>
              <div className="form-field">
                <label className="form-field__label">Description</label>
                <textarea className="form-field__textarea" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} />
              </div>
              <div className="form-field">
                <label className="form-field__label">Visibility *</label>
                <select className="form-field__input" value={formVisibility} onChange={(e) => setFormVisibility(e.target.value as OrgVisibility)}>
                  <option value="PRIVATE">Private (invite only)</option>
                  <option value="PUBLIC">Public (discoverable)</option>
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setShowCreate(false)} disabled={saving}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={handleCreate} disabled={saving || !formName.trim() || !formSlug.trim()}>
                <Save size={16} /> {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
