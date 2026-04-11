import { useEffect, useState } from 'react'
import {
  getUsers,
  createUser,
  updateUserRole,
  deleteUser,
  type UserItem,
} from '../services/userService'
import { getRoles } from '../services/authService'
import { Plus, Trash2, X, Save } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formRole, setFormRole] = useState('')
  const [saving, setSaving] = useState(false)

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(null) }
    else { setSuccess(msg); setError(null) }
    setTimeout(() => { setError(null); setSuccess(null) }, 4000)
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const [usersRes, rolesRes] = await Promise.all([getUsers(), getRoles()])
      setUsers(usersRes.data)
      const rolesData = rolesRes
      setRoles(Array.isArray(rolesData) ? rolesData : Object.keys(rolesData))
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreate = async () => {
    if (!formEmail.trim() || !formPassword || !formName.trim() || !formRole) return
    setSaving(true)
    try {
      await createUser({
        email: formEmail.trim(),
        password: formPassword,
        fullName: formName.trim(),
        phone: formPhone.trim(),
        role: formRole,
      })
      showMsg('User created.')
      setShowCreate(false)
      setFormEmail('')
      setFormPassword('')
      setFormName('')
      setFormPhone('')
      setFormRole('')
      fetchUsers()
    } catch {
      showMsg('Create failed.', true)
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole)
      showMsg('Role updated.')
      fetchUsers()
    } catch {
      showMsg('Role update failed.', true)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user?')) return
    try {
      await deleteUser(userId)
      showMsg('User deleted.')
      fetchUsers()
    } catch {
      showMsg('Delete failed.', true)
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">User Management</h1>
          <p className="page__subtitle">Manage user accounts and roles.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> Create User
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="table__empty">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="table__empty">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="table__title">{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    <select
                      className="form-field__input"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ padding: '6px 10px', height: 'auto', fontSize: '0.85rem' }}
                    >
                      {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button type="button" className="btn btn--sm btn--danger" onClick={() => handleDelete(u.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => !saving && setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Create User</h2>
              <button type="button" className="btn btn--icon" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="form-field">
                <label className="form-field__label">Full Name *</label>
                <input className="form-field__input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="John Doe" />
              </div>
              <div className="form-field">
                <label className="form-field__label">Email *</label>
                <input className="form-field__input" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="user@example.com" />
              </div>
              <div className="form-field">
                <label className="form-field__label">Phone</label>
                <input className="form-field__input" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="0912345678" />
              </div>
              <div className="form-field">
                <label className="form-field__label">Password *</label>
                <input className="form-field__input" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-field__label">Role *</label>
                <select className="form-field__input" value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                  <option value="">Select role</option>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setShowCreate(false)} disabled={saving}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={handleCreate} disabled={saving || !formEmail || !formPassword || !formName || !formRole}>
                <Save size={16} /> {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
