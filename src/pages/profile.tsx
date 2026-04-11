import { useEffect, useState } from 'react'
import { getProfile, updateProfile, changePassword, type UserItem } from '../services/userService'
import { Save, Lock } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Edit
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [saving, setSaving] = useState(false)

  // Password
  const [showPassword, setShowPassword] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(null) }
    else { setSuccess(msg); setError(null) }
    setTimeout(() => { setError(null); setSuccess(null) }, 4000)
  }

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await getProfile()
      setProfile(res.data)
      setEditName(res.data.fullName)
      setEditPhone(res.data.phone ?? '')
    } catch {
      setError('Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [])

  const handleSave = async () => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      await updateProfile({ fullName: editName.trim(), phone: editPhone.trim() })
      showMsg('Profile updated.')
      fetchProfile()
    } catch {
      showMsg('Update failed.', true)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!oldPw || !newPw) return
    if (newPw !== confirmPw) { showMsg('Passwords do not match.', true); return }
    if (newPw.length < 8) { showMsg('Password must be at least 8 characters.', true); return }
    setChangingPw(true)
    try {
      await changePassword({ oldPassword: oldPw, newPassword: newPw })
      showMsg('Password changed.')
      setShowPassword(false)
      setOldPw('')
      setNewPw('')
      setConfirmPw('')
    } catch {
      showMsg('Password change failed.', true)
    } finally {
      setChangingPw(false)
    }
  }

  if (loading) return <div className="page"><p>Loading...</p></div>

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">My Profile</h1>
          <p className="page__subtitle">View and update your account information.</p>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="form-field">
          <label className="form-field__label">Email</label>
          <input className="form-field__input" value={profile?.email ?? ''} disabled />
        </div>
        <div className="form-field">
          <label className="form-field__label">Role</label>
          <input className="form-field__input" value={profile?.role ?? ''} disabled />
        </div>
        <div className="form-field">
          <label className="form-field__label">Full Name</label>
          <input className="form-field__input" value={editName} onChange={(e) => setEditName(e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-field__label">Phone</label>
          <input className="form-field__input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => setShowPassword(!showPassword)}>
            <Lock size={16} /> Change Password
          </button>
        </div>
      </div>

      {showPassword && (
        <div className="card" style={{ maxWidth: 600, marginTop: 24 }}>
          <h3 style={{ margin: '0 0 16px' }}>Change Password</h3>
          <div className="form-field">
            <label className="form-field__label">Current Password</label>
            <input className="form-field__input" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-field__label">New Password</label>
            <input className="form-field__input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-field__label">Confirm New Password</label>
            <input className="form-field__input" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </div>
          <button type="button" className="btn btn--primary" onClick={handleChangePassword} disabled={changingPw} style={{ marginTop: 16 }}>
            {changingPw ? 'Changing...' : 'Update Password'}
          </button>
        </div>
      )}
    </div>
  )
}
