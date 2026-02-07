import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Camera, Lock, Save, XCircle, ChevronRight, Eye, EyeOff, Users, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react'
import apiClient from '../services/api'
import { useAuth } from '../context/AuthContext'

function Profile() {
  const { user, token, isAuthenticated, hasRole } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [activeTab, setActiveTab] = useState('info') // 'info', 'staff', 'apply'
  const [editMode, setEditMode] = useState(false)
  const [passwordMode, setPasswordMode] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: ''
  })
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  const [imageFile, setImageFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  // Staff/Apply states
  const [staffList, setStaffList] = useState([])
  const [applications, setApplications] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [applyRole, setApplyRole] = useState('SHIPPER')
  const [applyReason, setApplyReason] = useState('')

  const isAdmin = hasRole('ADMIN')

  useEffect(() => {
    fetchProfile()
    if (isAdmin) {
      fetchStaff()
      fetchApplications()
    } else {
      fetchMyApplications()
    }
  }, [isAdmin])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/users/me')
      setProfile(res.data)
      setFormData({
        full_name: res.data.full_name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: res.data.address || ''
      })
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const res = await apiClient.get('/admin/users')
      setStaffList(res.data)
    } catch (err) {}
  }

  const fetchApplications = async () => {
    try {
      const res = await apiClient.get('/admin/role-applications')
      setApplications(res.data)
    } catch (err) {}
  }

  const fetchMyApplications = async () => {
    try {
      const res = await apiClient.get('/users/my-applications')
      setMyApplications(res.data)
    } catch (err) {}
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      setError('')
      const res = await apiClient.put('/users/me', formData)
      setProfile(res.data)
      setSuccess('Profile updated successfully!')
      setEditMode(false)
      const savedUser = JSON.parse(localStorage.getItem('user'))
      localStorage.setItem('user', JSON.stringify({ ...savedUser, ...res.data }))
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match')
      return
    }
    try {
      setError('')
      await apiClient.put('/users/me/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })
      setSuccess('Password changed successfully!')
      setPasswordMode(false)
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Password change failed')
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImageFile(file)
    setAvatarPreview(URL.createObjectURL(file))

    const avatarFormData = new FormData()
    avatarFormData.append('file', file)
    try {
      const res = await apiClient.post('/users/me/avatar', avatarFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setProfile(res.data)
      setSuccess('Avatar updated!')
      const savedUser = JSON.parse(localStorage.getItem('user'))
      localStorage.setItem('user', JSON.stringify({ ...savedUser, avatar_url: res.data.avatar_url }))
    } catch (err) {
      setError('Avatar upload failed')
    }
  }

  const handleApplyRole = async (e) => {
    e.preventDefault()
    try {
      await apiClient.post('/users/apply-role', {
        role_name: applyRole,
        reason: applyReason
      })
      setSuccess('Application submitted!')
      setApplyReason('')
      fetchMyApplications()
    } catch (err) {
      setError(err.response?.data?.detail || 'Application failed')
    }
  }

  const handleUpdateAppStatus = async (appId, status) => {
    try {
      await apiClient.put(`/admin/role-applications/${appId}`, {
        status: status,
        admin_notes: 'Processed via admin panel'
      })
      setSuccess(`Application ${status.toLowerCase()}!`)
      fetchApplications()
      fetchStaff()
    } catch (err) {
      setError('Operation failed')
    }
  }

  const toggleUserRole = async (targetUser, roleName) => {
    let newRoles = [...targetUser.roles]
    if (newRoles.includes(roleName)) {
      newRoles = newRoles.filter(r => r !== roleName)
    } else {
      newRoles.push(roleName)
    }
    
    try {
      await apiClient.put(`/admin/users/${targetUser.id}/roles`, newRoles)
      setSuccess(`Updated roles for ${targetUser.username}`)
      fetchStaff()
    } catch (err) {
      setError('Failed to update roles')
    }
  }

  if (!isAuthenticated) return <div className="p-8 text-center">Please login to view profile.</div>
  if (loading) return <div className="p-8 text-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent mx-auto"></div></div>

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Left Section: Sidebar */}
        <div className="w-full space-y-4 md:w-80">
          <div className="card-surface p-6 text-center">
            <div className="relative mx-auto h-32 w-32 group">
              <div className="h-full w-full overflow-hidden rounded-full bg-slate-100 ring-4 ring-white shadow-lg">
                {profile?.avatar_url || avatarPreview ? (
                  <img 
                    src={avatarPreview || `${import.meta.env.VITE_API_URL}${profile.avatar_url}`} 
                    className="h-full w-full object-cover" 
                    alt="Avatar"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl font-bold text-slate-300">
                    {profile?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-brand-primary text-white shadow-lg hover:bg-brand-dark transition-all">
                <Camera className="h-5 w-5" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            
            <div className="mt-4">
              <h2 className="text-xl font-bold text-slate-900">{profile?.full_name || profile?.username}</h2>
              <p className="text-sm text-slate-500">{profile?.email}</p>
            </div>

            <div className="mt-8 space-y-2">
              <button 
                onClick={() => setActiveTab('info')}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all ${activeTab === 'info' ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  Personal Information
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform ${activeTab === 'info' ? 'rotate-90' : ''}`} />
              </button>

              {isAdmin ? (
                <button 
                  onClick={() => setActiveTab('staff')}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all ${activeTab === 'staff' ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    Staff Management
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${activeTab === 'staff' ? 'rotate-90' : ''}`} />
                </button>
              ) : (
                <button 
                  onClick={() => setActiveTab('apply')}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all ${activeTab === 'apply' ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-5 w-5" />
                    Role Application
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${activeTab === 'apply' ? 'rotate-90' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Main Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'info' && (
            <div className="card-surface p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Account Details</h2>
                {!editMode && !passwordMode && (
                  <div className="flex gap-2">
                    <button onClick={() => setEditMode(true)} className="btn-primary text-xs px-4 py-2">Edit Profile</button>
                    <button onClick={() => setPasswordMode(true)} className="btn-outline text-xs px-4 py-2">Change Password</button>
                  </div>
                )}
              </div>

              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">{error}</div>}
              {success && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 border border-green-100">{success}</div>}

              {editMode ? (
                <form onSubmit={handleUpdateProfile} className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500">Full Name</label>
                      <input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none transition-all shadow-sm" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Enter your full name" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500">Email Address</label>
                      <input type="email" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none transition-all shadow-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Enter your email" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500">Phone Number</label>
                      <input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none transition-all shadow-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Enter your phone number" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500">Shipping Address</label>
                      <textarea rows={3} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none transition-all shadow-sm" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Enter your full delivery address" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setEditMode(false)} className="btn-outline px-6">Cancel</button>
                    <button type="submit" className="btn-primary px-8 flex items-center gap-2">
                      <Save className="h-4 w-4" /> Save Changes
                    </button>
                  </div>
                </form>
              ) : passwordMode ? (
                <form onSubmit={handleChangePassword} className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500">Current Password</label>
                      <div className="relative">
                        <input type={showCurrentPassword ? "text" : "password"} required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none transition-all shadow-sm" value={passwordData.current_password} onChange={e => setPasswordData({...passwordData, current_password: e.target.value})} placeholder="••••••••" />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                          {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500">New Password</label>
                      <div className="relative">
                        <input type={showNewPassword ? "text" : "password"} required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none transition-all shadow-sm" value={passwordData.new_password} onChange={e => setPasswordData({...passwordData, new_password: e.target.value})} placeholder="Enter at least 6 characters" />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowNewPassword(!showNewPassword)}>
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500">Confirm New Password</label>
                      <input type={showNewPassword ? "text" : "password"} required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none transition-all shadow-sm" value={passwordData.confirm_password} onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})} placeholder="Repeat new password" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setPasswordMode(false)} className="btn-outline px-6">Cancel</button>
                    <button type="submit" className="btn-primary px-8 flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Update Password
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="grid gap-6">
                    <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50/50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500"><User className="h-6 w-6" /></div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Username</p>
                        <p className="text-lg font-semibold text-slate-700">{profile?.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50/50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-500"><Mail className="h-6 w-6" /></div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</p>
                        <p className="text-lg font-semibold text-slate-700">{profile?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50/50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Phone className="h-6 w-6" /></div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Number</p>
                        <p className="text-lg font-semibold text-slate-700">{profile?.phone || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50/50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-500"><MapPin className="h-6 w-6" /></div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Shipping Address</p>
                        <p className="text-lg font-semibold text-slate-700">{profile?.address || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Role Applications List */}
              <div className="card-surface p-6">
                <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Pending Role Requests</h2>
                <div className="mt-6 space-y-4">
                  {applications.filter(a => a.status === 'PENDING').length === 0 ? (
                    <p className="text-center py-8 text-slate-400">No pending applications.</p>
                  ) : (
                    applications.filter(a => a.status === 'PENDING').map(app => (
                      <div key={app.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-900">User: {app.username}</p>
                          <p className="text-sm text-slate-500">Requested Role: <span className="text-brand-primary font-bold">{app.role_name}</span></p>
                          <p className="text-xs text-slate-400 mt-1 italic">"{app.reason}"</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateAppStatus(app.id, 'APPROVED')} className="btn-primary bg-green-600 hover:bg-green-700 text-xs px-4">Approve</button>
                          <button onClick={() => handleUpdateAppStatus(app.id, 'REJECTED')} className="btn-outline text-red-500 hover:bg-red-50 text-xs px-4">Reject</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* All Users/Staff List */}
              <div className="card-surface p-6">
                <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">All Users & Staff</h2>
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs font-bold uppercase text-slate-400">
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Roles</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffList.map(u => (
                        <tr key={u.id}>
                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-700">{u.username}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {['USER', 'SHIPPER', 'ADMIN'].map(roleName => (
                                <button
                                  key={roleName}
                                  onClick={() => toggleUserRole(u, roleName)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                    u.roles.includes(roleName) 
                                      ? (roleName === 'ADMIN' ? 'bg-red-100 text-red-700' : roleName === 'SHIPPER' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600')
                                      : 'bg-slate-50 text-slate-300 border border-slate-100 hover:border-brand-primary'
                                  }`}
                                >
                                  {roleName}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`h-2 w-2 rounded-full inline-block mr-2 ${u.is_active ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'apply' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="card-surface p-6">
                <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Apply for a New Role</h2>
                <form onSubmit={handleApplyRole} className="mt-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Select Role</label>
                    <select className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none" value={applyRole} onChange={e => setApplyRole(e.target.value)}>
                      <option value="SHIPPER">Shipper (Delivery Partner)</option>
                      <option value="ADMIN">Admin (Store Manager)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Why do you want this role?</label>
                    <textarea rows={3} required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none" value={applyReason} onChange={e => setApplyReason(e.target.value)} placeholder="Tell us why you are a good fit..." />
                  </div>
                  <button type="submit" className="btn-primary w-full py-3">Submit Application</button>
                </form>
              </div>

              <div className="card-surface p-6">
                <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Application History</h2>
                <div className="mt-6 space-y-4">
                  {myApplications.length === 0 ? (
                    <p className="text-center py-8 text-slate-400">No applications found.</p>
                  ) : (
                    myApplications.map(app => (
                      <div key={app.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-900">Application for {app.role_name}</p>
                          <p className="text-xs text-slate-500">{new Date(app.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {app.status === 'PENDING' && <span className="flex items-center gap-1 text-xs font-bold text-orange-500"><AlertCircle className="h-4 w-4" /> Pending</span>}
                          {app.status === 'APPROVED' && <span className="flex items-center gap-1 text-xs font-bold text-green-600"><CheckCircle2 className="h-4 w-4" /> Approved</span>}
                          {app.status === 'REJECTED' && <span className="flex items-center gap-1 text-xs font-bold text-red-500"><XCircle className="h-4 w-4" /> Rejected</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
