import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import api from '../../api/axios'
import { fmtRelative } from '../../utils/helpers'

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuthStore()
  const { dark, toggle } = useThemeStore()
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const notifsRef = useRef()
  const userRef = useRef()

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false)
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get('/notifications')
      setNotifs(data.data)
      setUnread(data.unreadCount)
    } catch {}
  }

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`)
    fetchNotifs()
  }

  const markAllRead = async () => {
    await api.put('/notifications/mark-all-read')
    fetchNotifs()
  }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <header className="h-16 bg-white dark:bg-dark-900 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="hidden sm:block">
          <div className="text-sm font-semibold text-slate-800 dark:text-white">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button onClick={toggle} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifsRef}>
          <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
            🔔
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 card shadow-xl z-50 animate-slide-up">
              <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-800 dark:text-white">Notifications</span>
                {unread > 0 && <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">Mark all read</button>}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {notifs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">No notifications</div>
                ) : notifs.slice(0, 10).map(n => (
                  <div key={n._id} onClick={() => markRead(n._id)}
                    className={`p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!n.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</div>
                    <div className="text-xs text-slate-400 mt-1">{fmtRelative(n.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button onClick={() => setShowUser(!showUser)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-slate-800 dark:text-white leading-tight">{user?.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</div>
            </div>
          </button>
          {showUser && (
            <div className="absolute right-0 top-12 w-48 card shadow-xl z-50 animate-slide-up py-1">
              <button onClick={() => { setShowUser(false); navigate('/admin?tab=profile') }}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                👤 My Profile
              </button>
              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
              <button onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
