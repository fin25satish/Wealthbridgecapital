import { useState } from 'react'
import { Settings, User, Bell, Shield, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  const [tab, setTab] = useState<'profile' | 'alerts' | 'security'>('profile')

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Settings size={22} className="text-brand-400" /> Settings
      </h1>

      <div className="border-b border-surface-border flex gap-1 mb-6">
        {([
          { key: 'profile', label: 'Profile', icon: User },
          { key: 'alerts', label: 'Alert Preferences', icon: Bell },
          { key: 'security', label: 'Security', icon: Shield },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 border-b-2 transition-colors -mb-px ${
              tab === key ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-white">Account Information</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Full Name</label>
              <input className="input w-full" defaultValue={user?.full_name || ''} readOnly />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email</label>
              <input className="input w-full" defaultValue={user?.email || ''} readOnly />
            </div>
          </div>
          <p className="text-xs text-slate-500">Profile editing will be available in a future update.</p>
        </div>
      )}

      {tab === 'alerts' && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Alert Preferences</h2>
          <p className="text-sm text-slate-400">Price alerts are checked every 5 minutes via background jobs.</p>
          <div className="space-y-3">
            {[
              { label: 'Email notifications', desc: 'Send email when alert is triggered' },
              { label: 'Browser push notifications', desc: 'Requires browser permission' },
              { label: 'Auto-deactivate after trigger', desc: 'Alert will fire once then deactivate' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-surface-hover rounded-lg">
                <div>
                  <p className="text-sm text-white">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <div className="w-10 h-5 bg-slate-700 rounded-full relative cursor-not-allowed opacity-50">
                  <div className="w-4 h-4 bg-slate-500 rounded-full absolute top-0.5 left-0.5" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">Notification settings will be configurable in a future update.</p>
        </div>
      )}

      {tab === 'security' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-white">Change Password</h2>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Current Password</label>
              <input type="password" className="input w-full" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">New Password</label>
              <input type="password" className="input w-full" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Confirm New Password</label>
              <input type="password" className="input w-full" placeholder="••••••••" />
            </div>
            <button className="btn-primary text-sm">Update Password</button>
          </div>

          <div className="card border-danger/20">
            <h2 className="font-semibold text-white mb-3">Danger Zone</h2>
            <button onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-danger border border-danger/30 px-4 py-2 rounded-lg hover:bg-danger/10 transition-colors">
              <LogOut size={15} /> Sign out of all sessions
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
