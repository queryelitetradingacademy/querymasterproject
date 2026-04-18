import api from './axios'
export const getTasks = (params) => api.get('/tasks', { params })
export const getTask = (id) => api.get(`/tasks/${id}`)
export const createTask = (data) => api.post('/tasks', data)
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`)
export const updateSubtask = (taskId, subtaskId, data) => api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, data)
export const getTaskStats = () => api.get('/tasks/stats')
