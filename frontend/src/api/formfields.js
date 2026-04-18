import api from './axios'
export const getPublicFields = () => api.get('/form-fields/public')
export const getAllFields = () => api.get('/form-fields')
export const createField = (data) => api.post('/form-fields', data)
export const updateField = (id, data) => api.put(`/form-fields/${id}`, data)
export const deleteField = (id) => api.delete(`/form-fields/${id}`)
