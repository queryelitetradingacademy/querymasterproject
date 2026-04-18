import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('qm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || 'Something went wrong'
    if (err.response?.status === 401) {
      localStorage.removeItem('qm_token')
      localStorage.removeItem('qm_user')
      window.location.href = '/login'
    } else if (err.response?.status !== 404) {
      toast.error(msg)
    }
    return Promise.reject(err)
  }
)

export default api
