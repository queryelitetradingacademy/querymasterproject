import { create } from 'zustand'
import { login as loginApi, getMe } from '../api/auth'

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('qm_user') || 'null'),
  token: localStorage.getItem('qm_token') || null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await loginApi({ email, password })
      localStorage.setItem('qm_token', data.token)
      localStorage.setItem('qm_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, loading: false })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      return { success: false, message: err.response?.data?.message }
    }
  },

  logout: () => {
    localStorage.removeItem('qm_token')
    localStorage.removeItem('qm_user')
    set({ user: null, token: null })
  },

  refreshUser: async () => {
    try {
      const { data } = await getMe()
      localStorage.setItem('qm_user', JSON.stringify(data.user))
      set({ user: data.user })
    } catch {}
  },

  isAdmin: () => get().user?.role === 'admin',

  can: (segment, action) => {
    const user = get().user
    if (!user) return false
    if (user.role === 'admin') return true
    return user.permissions?.[segment]?.[action] === true
  }
}))

export default useAuthStore
