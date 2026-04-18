import { useState, useEffect } from 'react'
import { getUsers, createUser, updateUser, updatePermissions, toggleUserStatus, deleteUser, resetUserPassword, getSettings, updateSetting, addSettingValue, removeSettingValue } from '../../api/admin'
import { getAllFields, createField, updateField, deleteField } from '../../api/formfields'
import { Modal, Confirm, Spinner, Empty, Tabs, FormField, Select } from '../../components/common'
import { changePassword, updateProfile } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const tabs = [
  { value: 'profile', label: 'My Profile', icon: '👤' },
  { value: 'users', label: 'Sub Admins', icon: '👥' },
  { value: 'publicform', label: 'Public Form', icon: '📋' },
  { value: 'settings', label: 'System Settings', icon: '⚙️' },
]

const SEGMENTS = ['queries', 'tasks', 'finance']
const ACTIONS = ['view', 'create', 'edit', 'delete', 'export']

export default function AdminPage() {
  const [tab, setTab] = useState('profile')
  const { isAdmin } = useAuthStore()

  if (!isAdmin()) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <div className="text-center"><div className="text-4xl mb-2">🔒</div><p>Admin access required</p></div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Admin Panel</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage users, public form, permissions and system settings</p>
      </div>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'profile' && <ProfileTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'publicform' && <PublicFormTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  )
}

// ===================== PROFILE TAB =====================
function ProfileTab() {
  const { user, refreshUser } = useAuthStore()
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPass, setSavingPass] = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!profileForm.name) return toast.error('Name is required')
    setSavingProfile(true)
    try {
      await updateProfile(profileForm)
      await refreshUser()
      toast.success('Profile updated!')
    } catch {}
    setSavingProfile(false)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!passForm.currentPassword || !passForm.newPassword) return toast.error('Fill all fields')
    if (passForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters')
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Passwords do not match')
    setSavingPass(true)
    try {
      await changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword })
      toast.success('Password changed! Please login again.')
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch {}
    setSavingPass(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="card p-6">
        <h3 className="section-title mb-5">👤 Profile Information</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white text-lg">{user?.name}</div>
            <div className="text-slate-500 dark:text-slate-400 text-sm">{user?.email}</div>
            <span className="badge badge-purple capitalize mt-1">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <FormField label="Full Name" required>
            <input className="input" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="Phone Number">
            <input className="input" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="Your phone number" />
          </FormField>
          <FormField label="Email">
            <input className="input opacity-60 cursor-not-allowed" value={user?.email} disabled />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
          </FormField>
          <button type="submit" disabled={savingProfile} className="btn-primary w-full justify-center">
            {savingProfile ? '⏳ Saving...' : '✅ Save Profile'}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-5">🔑 Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <FormField label="Current Password" required>
            <input className="input" type="password" value={passForm.currentPassword}
              onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="Enter current password" />
          </FormField>
          <FormField label="New Password" required>
            <input className="input" type="password" value={passForm.newPassword}
              onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min 6 characters" />
          </FormField>
          <FormField label="Confirm New Password" required>
            <input className="input" type="password" value={passForm.confirmPassword}
              onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
          </FormField>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-700 dark:text-yellow-400">⚠️ After changing password you will need to login again.</p>
          </div>
          <button type="submit" disabled={savingPass} className="btn-primary w-full justify-center">
            {savingPass ? '⏳ Changing...' : '🔑 Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ===================== PUBLIC FORM TAB =====================
function PublicFormTab() {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editField, setEditField] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ label: '', fieldName: '', fieldType: 'text', placeholder: '', isRequired: false, isActive: true, options: '' })
  const formLink = `${window.location.origin}/public-form`

  useEffect(() => { fetchFields() }, [])

  const fetchFields = async () => {
    setLoading(true)
    try { const res = await getAllFields(); setFields(res.data.data) } catch {}
    setLoading(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.label || !form.fieldName) return toast.error('Label and field name required')
    try {
      const payload = {
        ...form,
        fieldName: form.fieldName.toLowerCase().replace(/\s+/g, '_'),
        options: form.fieldType === 'select' && form.options
          ? form.options.split(',').map(o => ({ label: o.trim(), value: o.trim().toLowerCase().replace(/\s+/g, '_') }))
          : []
      }
      if (editField) await updateField(editField._id, payload)
      else await createField(payload)
      toast.success(editField ? 'Field updated!' : 'Field added!')
      setShowForm(false); setEditField(null)
      fetchFields()
    } catch {}
  }

  const handleDelete = async (id) => {
    try { await deleteField(id); toast.success('Field deleted'); fetchFields() } catch {}
  }

  const handleToggle = async (field) => {
    try {
      await updateField(field._id, { isActive: !field.isActive })
      toast.success(field.isActive ? 'Field hidden' : 'Field shown')
      fetchFields()
    } catch {}
  }

  const handleToggleRequired = async (field) => {
    try {
      await updateField(field._id, { isRequired: !field.isRequired })
      toast.success(`Field marked ${!field.isRequired ? 'required' : 'optional'}`)
      fetchFields()
    } catch {}
  }

  const copyLink = () => {
    navigator.clipboard.writeText(formLink)
    toast.success('Link copied to clipboard!')
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-5">
      {/* Public Form Link Card */}
      <div className="card p-5 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-semibold text-primary-900 dark:text-primary-300 flex items-center gap-2">
              🔗 Public Enquiry Form Link
            </h3>
            <p className="text-sm text-primary-700 dark:text-primary-400 mt-1">Share this link in Meta Ads, Instagram bio, WhatsApp etc.</p>
            <div className="mt-2 flex items-center gap-2 bg-white dark:bg-dark-800 border border-primary-200 dark:border-primary-700 rounded-lg px-3 py-2">
              <span className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">{formLink}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={copyLink} className="btn-primary">📋 Copy Link</button>
            <a href={formLink} target="_blank" rel="noreferrer" className="btn-secondary">👁️ Preview</a>
          </div>
        </div>
      </div>

      {/* Fields Management */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="section-title">Form Fields</h3>
          <p className="text-xs text-slate-400 mt-0.5">Add, remove, reorder and control fields shown on the public form</p>
        </div>
        <button onClick={() => { setForm({ label: '', fieldName: '', fieldType: 'text', placeholder: '', isRequired: false, isActive: true, options: '' }); setEditField(null); setShowForm(true) }}
          className="btn-primary">➕ Add Field</button>
      </div>

      <div className="card overflow-hidden">
        {fields.length === 0 ? <Empty icon="📋" title="No fields yet" desc="Add fields to your public form" /> : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {fields.map((field, i) => (
              <div key={field._id} className={`flex items-center gap-3 p-4 ${!field.isActive ? 'opacity-50' : ''}`}>
                <div className="text-slate-300 dark:text-slate-600 text-sm font-mono w-5 text-center">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{field.label}</span>
                    {field.isRequired && <span className="badge badge-red text-xs">Required</span>}
                    {!field.isRequired && <span className="badge badge-gray text-xs">Optional</span>}
                    {!field.isActive && <span className="badge badge-yellow text-xs">Hidden</span>}
                    {field.isDefault && <span className="badge badge-blue text-xs">Default</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Type: {field.fieldType} · Key: <span className="font-mono">{field.fieldName}</span>
                    {field.placeholder && ` · Placeholder: "${field.placeholder}"`}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                  {/* Required toggle */}
                  <button onClick={() => handleToggleRequired(field)}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${field.isRequired ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                    {field.isRequired ? '★ Required' : '☆ Optional'}
                  </button>
                  {/* Show/Hide toggle */}
                  <button onClick={() => handleToggle(field)}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${field.isActive ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                    {field.isActive ? '👁️ Shown' : '🙈 Hidden'}
                  </button>
                  {/* Edit */}
                  <button onClick={() => {
                    setEditField(field)
                    setForm({ ...field, options: field.options?.map(o => o.label).join(', ') || '' })
                    setShowForm(true)
                  }} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-500 text-sm">✏️</button>
                  {/* Delete — only non-default */}
                  {!field.isDefault && (
                    <button onClick={() => setDeleteId(field._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500 text-sm">🗑️</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Field Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditField(null) }}
        title={editField ? 'Edit Form Field' : 'Add Form Field'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Field Label" required>
            <input className="input" value={form.label} onChange={e => set('label', e.target.value)} placeholder="e.g. Full Name, Phone Number" />
          </FormField>
          <FormField label="Field Key (no spaces)" required>
            <input className="input font-mono" value={form.fieldName}
              onChange={e => set('fieldName', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="e.g. full_name, phone" disabled={editField?.isDefault} />
            {editField?.isDefault && <p className="text-xs text-slate-400 mt-1">Default field key cannot be changed</p>}
          </FormField>
          <FormField label="Field Type">
            <Select value={form.fieldType} onChange={e => set('fieldType', e.target.value)}
              options={[
                { label: 'Text', value: 'text' },
                { label: 'Email', value: 'email' },
                { label: 'Phone Number', value: 'tel' },
                { label: 'Number', value: 'number' },
                { label: 'Textarea (Long Text)', value: 'textarea' },
                { label: 'Dropdown (Select)', value: 'select' },
                { label: 'Date', value: 'date' },
              ]} />
          </FormField>
          {form.fieldType === 'select' && (
            <FormField label="Options (comma separated)">
              <input className="input" value={form.options} onChange={e => set('options', e.target.value)}
                placeholder="Option 1, Option 2, Option 3" />
            </FormField>
          )}
          <FormField label="Placeholder Text">
            <input className="input" value={form.placeholder} onChange={e => set('placeholder', e.target.value)}
              placeholder="Hint shown inside the field" />
          </FormField>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.isRequired} onChange={e => set('isRequired', e.target.checked)} className="w-4 h-4 accent-primary-600" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Required field</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="w-4 h-4 accent-primary-600" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Show on form</span>
            </label>
          </div>
          <button type="submit" className="btn-primary w-full justify-center">
            {editField ? '✅ Update Field' : '➕ Add Field'}
          </button>
        </form>
      </Modal>

      <Confirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)}
        title="Delete Field" message="This will remove this field from the public form." danger />
    </div>
  )
}

// ===================== USERS TAB =====================
function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [showPerms, setShowPerms] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [showResetPass, setShowResetPass] = useState(null)
  const [newPass, setNewPass] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'sub_admin', phone: '' })
  const [perms, setPerms] = useState({})

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try { const res = await getUsers(); setUsers(res.data.data) } catch {}
    setLoading(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) return toast.error('Name and email required')
    if (!editUser && !form.password) return toast.error('Password required for new user')
    if (!editUser && form.password.length < 6) return toast.error('Password must be at least 6 characters')
    try {
      if (editUser) await updateUser(editUser._id, { name: form.name, phone: form.phone, role: form.role })
      else await createUser(form)
      toast.success(editUser ? 'Sub admin updated!' : 'Sub admin created!')
      setShowForm(false); setEditUser(null)
      fetchData()
    } catch {}
  }

  const handleToggle = async (id) => {
    try { await toggleUserStatus(id); toast.success('Status updated'); fetchData() } catch {}
  }

  const handleDelete = async (id) => {
    try { await deleteUser(id); toast.success('Deleted'); fetchData() } catch {}
  }

  const handleResetPass = async () => {
    if (!newPass || newPass.length < 6) return toast.error('Min 6 characters')
    try { await resetUserPassword(showResetPass, { newPassword: newPass }); toast.success('Password reset!'); setShowResetPass(null); setNewPass('') } catch {}
  }

  const openPerms = (user) => {
    setShowPerms(user._id)
    const p = user.permissions || {}
    const built = {}
    SEGMENTS.forEach(seg => {
      built[seg] = {}
      ACTIONS.forEach(act => { built[seg][act] = p[seg]?.[act] || false })
    })
    setPerms(built)
  }

  const togglePerm = (seg, act) => setPerms(p => ({ ...p, [seg]: { ...p[seg], [act]: !p[seg][act] } }))

  const savePerms = async () => {
    try { await updatePermissions(showPerms, { permissions: perms }); toast.success('Permissions saved!'); setShowPerms(null); fetchData() } catch {}
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="section-title">Sub Admins</h3>
          <p className="text-xs text-slate-400 mt-0.5">Create team members and control exactly what they can access</p>
        </div>
        <button onClick={() => { setForm({ name: '', email: '', password: '', role: 'sub_admin', phone: '' }); setEditUser(null); setShowForm(true) }} className="btn-primary">➕ Create Sub Admin</button>
      </div>

      <div className="card overflow-hidden">
        {users.length === 0 ? (
          <Empty icon="👥" title="No sub admins yet" desc="Create your first team member" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">{u.name}</div>
                          {u.phone && <div className="text-xs text-slate-400">{u.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{u.email}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'} capitalize`}>{u.role?.replace('_', ' ')}</span></td>
                    <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-xs text-slate-400">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}</td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={() => { setEditUser(u); setForm({ name: u.name, email: u.email, role: u.role, phone: u.phone || '' }); setShowForm(true) }}
                          className="btn-ghost text-xs px-2 py-1">✏️ Edit</button>
                        <button onClick={() => openPerms(u)} className="btn-ghost text-xs px-2 py-1">🔐 Perms</button>
                        <button onClick={() => handleToggle(u._id)}
                          className={`text-xs px-2 py-1 rounded-lg ${u.isActive ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                          {u.isActive ? '🚫 Disable' : '✅ Enable'}
                        </button>
                        <button onClick={() => setShowResetPass(u._id)} className="btn-ghost text-xs px-2 py-1">🔑 Reset</button>
                        <button onClick={() => setDeleteId(u._id)} className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditUser(null) }}
        title={editUser ? 'Edit Sub Admin' : 'Create Sub Admin'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Full Name" required>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" />
          </FormField>
          <FormField label="Email" required>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} disabled={!!editUser} placeholder="Email address" />
          </FormField>
          {!editUser && (
            <FormField label="Password" required>
              <input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" />
            </FormField>
          )}
          <FormField label="Phone">
            <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone number" />
          </FormField>
          <button type="submit" className="btn-primary w-full justify-center">
            {editUser ? '✅ Update Sub Admin' : '➕ Create Sub Admin'}
          </button>
        </form>
      </Modal>

      {/* Permissions Modal */}
      <Modal open={!!showPerms} onClose={() => setShowPerms(null)} title="Manage Permissions" size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Select what this sub admin can access and do in each segment.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 text-slate-600 dark:text-slate-400 font-medium">Segment</th>
                  {ACTIONS.map(a => (
                    <th key={a} className="text-center py-2 px-3 text-slate-600 dark:text-slate-400 font-medium capitalize">{a}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SEGMENTS.map(seg => (
                  <tr key={seg} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-200 capitalize">{seg}</td>
                    {ACTIONS.map(act => (
                      <td key={act} className="text-center py-3 px-3">
                        <input type="checkbox" checked={perms[seg]?.[act] || false}
                          onChange={() => togglePerm(seg, act)} className="w-4 h-4 accent-primary-600 cursor-pointer" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowPerms(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={savePerms} className="btn-primary flex-1 justify-center">✅ Save Permissions</button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={!!showResetPass} onClose={() => { setShowResetPass(null); setNewPass('') }} title="Reset Password" size="sm">
        <div className="space-y-4">
          <FormField label="New Password">
            <input className="input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 6 characters" />
          </FormField>
          <button onClick={handleResetPass} className="btn-primary w-full justify-center">🔑 Reset Password</button>
        </div>
      </Modal>

      <Confirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)}
        title="Delete Sub Admin" message="This will permanently delete this account." danger />
    </div>
  )
}

// ===================== SETTINGS TAB =====================
function SettingsTab() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('queries')
  const [newValue, setNewValue] = useState({})
  const [saving, setSaving] = useState({})
  const categories = ['queries', 'tasks', 'finance', 'system', 'notifications']

  useEffect(() => { fetchData() }, [activeCategory])

  const fetchData = async () => {
    setLoading(true)
    try { const res = await getSettings({ category: activeCategory }); setSettings(res.data.data) } catch {}
    setLoading(false)
  }

  const handleAddValue = async (settingId) => {
    const val = newValue[settingId]
    if (!val?.label || !val?.value) return toast.error('Label and value required')
    setSaving(s => ({ ...s, [settingId]: true }))
    try {
      await addSettingValue(settingId, { label: val.label, value: val.value.toLowerCase().replace(/\s+/g, '_') })
      toast.success('Option added!')
      setNewValue(v => ({ ...v, [settingId]: { label: '', value: '' } }))
      fetchData()
    } catch {}
    setSaving(s => ({ ...s, [settingId]: false }))
  }

  const handleRemoveValue = async (settingId, valueId) => {
    try { await removeSettingValue(settingId, valueId); toast.success('Removed'); fetchData() } catch {}
  }

  const handleToggleSetting = async (setting) => {
    try { await updateSetting(setting._id, { value: !setting.value }); toast.success('Updated'); fetchData() } catch {}
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${activeCategory === cat ? 'bg-primary-600 text-white' : 'btn-secondary'}`}>
            {cat}
          </button>
        ))}
      </div>

      {settings.map(setting => (
        <div key={setting._id} className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-white">{setting.label}</h4>
              {setting.description && <p className="text-xs text-slate-400 mt-0.5">{setting.description}</p>}
            </div>
            {setting.type === 'boolean' && (
              <button onClick={() => handleToggleSetting(setting)}
                className={`relative w-11 h-6 rounded-full transition-colors ${setting.value ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${setting.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            )}
          </div>
          {setting.type === 'dropdown_options' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {setting.values?.map(v => (
                  <span key={v._id} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1 rounded-full">
                    {v.label}
                    <button onClick={() => handleRemoveValue(setting._id, v._id)} className="text-slate-400 hover:text-red-500 transition-colors">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Label (display name)"
                  value={newValue[setting._id]?.label || ''}
                  onChange={e => setNewValue(v => ({ ...v, [setting._id]: { ...v[setting._id], label: e.target.value } }))} />
                <input className="input w-40" placeholder="Value (code)"
                  value={newValue[setting._id]?.value || ''}
                  onChange={e => setNewValue(v => ({ ...v, [setting._id]: { ...v[setting._id], value: e.target.value } }))} />
                <button onClick={() => handleAddValue(setting._id)} disabled={saving[setting._id]} className="btn-primary px-3">
                  {saving[setting._id] ? '⏳' : '+ Add'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
