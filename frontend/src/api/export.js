import api from './axios'

export const exportQueries = (params) => api.get('/export/queries', { params, responseType: 'blob' })
export const exportFinance = (params) => api.get('/export/finance', { params, responseType: 'blob' })
export const exportTasks = (params) => api.get('/export/tasks', { params, responseType: 'blob' })

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
