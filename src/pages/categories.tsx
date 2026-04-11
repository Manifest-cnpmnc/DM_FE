import { useEffect, useState } from 'react'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryItem,
} from '../services/categoryService'
import { Plus, Edit3, Trash2, X, Save } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(null) }
    else { setSuccess(msg); setError(null) }
    setTimeout(() => { setError(null); setSuccess(null) }, 4000)
  }

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await getCategories()
      setCategories(res.data)
    } catch {
      setError('Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const openCreate = () => {
    setEditingId(null)
    setFormName('')
    setFormDesc('')
    setShowModal(true)
  }

  const openEdit = (cat: CategoryItem) => {
    setEditingId(cat.id)
    setFormName(cat.name)
    setFormDesc(cat.description)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await updateCategory(editingId, { name: formName.trim(), description: formDesc.trim() })
        showMsg('Category updated.')
      } else {
        await createCategory({ name: formName.trim(), description: formDesc.trim() })
        showMsg('Category created.')
      }
      setShowModal(false)
      fetchCategories()
    } catch {
      showMsg('Save failed.', true)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return
    try {
      await deleteCategory(id)
      showMsg('Category deleted.')
      fetchCategories()
    } catch {
      showMsg('Delete failed.', true)
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Categories</h1>
          <p className="page__subtitle">Manage document categories.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={openCreate}>
          <Plus size={18} /> New Category
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="table__empty">Loading...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={4} className="table__empty">No categories found.</td></tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="table__title">{cat.name}</td>
                  <td>{cat.description || '—'}</td>
                  <td>{new Date(cat.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="btn btn--sm btn--secondary" onClick={() => openEdit(cat)}><Edit3 size={14} /> Edit</button>
                      <button type="button" className="btn btn--sm btn--danger" onClick={() => handleDelete(cat.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{editingId ? 'Edit Category' : 'New Category'}</h2>
              <button type="button" className="btn btn--icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="form-field">
                <label className="form-field__label">Name *</label>
                <input className="form-field__input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Category name" />
              </div>
              <div className="form-field">
                <label className="form-field__label">Description</label>
                <textarea className="form-field__textarea" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Description" rows={3} />
              </div>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving || !formName.trim()}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
