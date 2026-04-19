import { useState, useEffect } from 'react'
import { getTasks, createTask, updateTask, deleteTask } from '../../api/tasks'
import api from '../../api/axios'
import { Modal, Confirm, Spinner, Empty, SearchInput, Tabs, StatCard } from '../../components/common'
import { fmtDate, priorityLabel, priorityColor, statusLabel, statusColor, dueDateColor } from '../../utils/helpers'
import { exportTasks, downloadBlob } from '../../api/export'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import TaskForm from './TaskForm'
import KanbanView from './KanbanView'
import CalendarView from './CalendarView'

const viewTabs = [
  { value: 'list', label: 'List', icon: '☰' },
  { value: 'kanban', label: 'Kanban', icon: '⊞' },
  { value: 'calendar', label: 'Calendar', icon: '📅' },
]

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'done', label: 'Done' },
]

const SUBTASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: 'text-slate-500' },
  { value: 'in_progress', label: 'In Progress', color: 'text-blue-500' },
  { value: 'on_hold', label: 'On Hold', color: 'text-yellow-500' },
  { value: 'done', label: 'Done', color: 'text-green-500' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [expandedTask, setExpandedTask] = useState({})
  const [editSubtask, setEditSubtask] = useState(null)
  const [showSubtaskForm, setShowSubtaskForm] = useState(null) // taskId
  const [subtaskForm, setSubtaskForm] = useState({ title: '', description: '', priority: 'p3', dueDate: '', status: 'todo', reminderEnabled: false, reminderDate: '', reminderTime: '' })
  const [deleteSubtask, setDeleteSubtask] = useState(null)
  const [stats, setStats] = useState({})
  const { can } = useAuthStore()

  useEffect(() => { fetchData() }, [statusFilter, search])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = { search, limit: 100 }
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await getTasks(params)
      setTasks(res.data.data)
      const all = res.data.data
      setStats({
        total: all.length,
        todo: all.filter(t => t.status === 'todo').length,
        inProgress: all.filter(t => t.status === 'in_progress').length,
        done: all.filter(t => t.status === 'done').length,
        overdue: all.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()).length
      })
    } catch {}
    setLoading(false)
  }

  const handleStatusChange = async (taskId, status) => {
    try {
      await updateTask(taskId, { status })
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t))
      toast.success(`→ ${statusLabel[status]}`)
    } catch {}
  }

  const handleDelete = async (id) => {
    try { await deleteTask(id); toast.success('Task deleted'); fetchData() } catch {}
  }

  const handleExport = async () => {
    try { const res = await exportTasks({}); downloadBlob(res.data, 'Tasks.xlsx'); toast.success('Exported!') } catch {}
  }

  const toggleExpand = (taskId) => setExpandedTask(e => ({ ...e, [taskId]: !e[taskId] }))

  // Subtask actions
  const handleSubtaskStatusChange = async (taskId, subtaskId, status) => {
    try {
      await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, { status })
      toast.success(`Subtask → ${statusLabel[status]}`)
      fetchData()
    } catch {}
  }

  const handleSubtaskDelete = async (taskId, subtaskId) => {
    try {
      await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`)
      toast.success('Subtask deleted')
      fetchData()
    } catch {}
  }

  const handleSubtaskSave = async (e) => {
    e.preventDefault()
    if (!subtaskForm.title) return toast.error('Title required')
    try {
      const payload = {
        ...subtaskForm,
        dueDate: subtaskForm.dueDate || undefined,
        reminder: subtaskForm.reminderEnabled && subtaskForm.reminderDate ? {
          datetime: new Date(`${subtaskForm.reminderDate}T${subtaskForm.reminderTime || '09:00'}`),
          channels: ['inapp'],
          enabled: true
        } : undefined
      }
      if (editSubtask) {
        await api.put(`/tasks/${showSubtaskForm}/subtasks/${editSubtask._id}`, payload)
        toast.success('Subtask updated!')
      } else {
        await api.post(`/tasks/${showSubtaskForm}/subtasks`, payload)
        toast.success('Subtask added!')
      }
      setShowSubtaskForm(null); setEditSubtask(null)
      setSubtaskForm({ title: '', description: '', priority: 'p3', dueDate: '', status: 'todo', reminderEnabled: false, reminderDate: '', reminderTime: '' })
      fetchData()
    } catch {}
  }

  // Compute task auto-status label based on subtask progress
  const getTaskProgress = (task) => {
    if (!task.subtasks || task.subtasks.length === 0) return null
    const done = task.subtasks.filter(s => s.status === 'done').length
    const total = task.subtasks.length
    return { done, total, percent: Math.round((done / total) * 100) }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Task Organiser</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Tasks, subtasks, reminders and tracking</p>
        </div>
        <div className="flex items-center gap-2">
          {can('tasks', 'export') && <button onClick={handleExport} className="btn-secondary">📥 Export</button>}
          {can('tasks', 'create') && (
            <button onClick={() => { setEditTask(null); setShowForm(true) }} className="btn-primary">➕ New Task</button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard icon="📋" label="Total" value={stats.total || 0} color="blue" />
        <StatCard icon="○" label="To Do" value={stats.todo || 0} color="indigo" />
        <StatCard icon="◑" label="In Progress" value={stats.inProgress || 0} color="yellow" />
        <StatCard icon="✓" label="Done" value={stats.done || 0} color="green" />
        <StatCard icon="🚨" label="Overdue" value={stats.overdue || 0} color="red" />
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-48"><Tabs tabs={viewTabs} active={view} onChange={setView} /></div>
          <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search tasks..." /></div>
        </div>
        {view === 'list' && <Tabs tabs={statusTabs} active={statusFilter} onChange={setStatusFilter} />}
      </div>

      {/* Views */}
      {loading ? <Spinner /> : (
        <>
          {view === 'list' && (
            <div className="card overflow-hidden">
              {tasks.length === 0 ? (
                <Empty icon="✅" title="No tasks" desc="Create your first task"
                  action={can('tasks', 'create') && <button onClick={() => setShowForm(true)} className="btn-primary">➕ Add Task</button>} />
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {tasks.map(task => {
                    const progress = getTaskProgress(task)
                    const isExpanded = expandedTask[task._id]

                    return (
                      <div key={task._id}>
                        {/* Main Task Row */}
                        <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <div className="flex items-start gap-3">
                            {/* Status circle */}
                            <button onClick={() => handleStatusChange(task._id, task.status === 'done' ? 'todo' : 'done')}
                              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-primary-500'}`}>
                              {task.status === 'done' && <span className="text-xs">✓</span>}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <span className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                    {task.title}
                                  </span>
                                  {task.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {/* Status dropdown */}
                                  <select value={task.status}
                                    onChange={e => handleStatusChange(task._id, e.target.value)}
                                    className="text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300 cursor-pointer"
                                    onClick={e => e.stopPropagation()}>
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="done">Done</option>
                                  </select>
                                  {can('tasks', 'edit') && (
                                    <button onClick={() => { setEditTask(task); setShowForm(true) }}
                                      className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-500 text-sm">✏️</button>
                                  )}
                                  {can('tasks', 'delete') && (
                                    <button onClick={() => setDeleteId(task._id)}
                                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500 text-sm">🗑️</button>
                                  )}
                                </div>
                              </div>

                              {/* Badges row */}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className={`badge text-xs ${priorityColor[task.priority]}`}>{priorityLabel[task.priority]}</span>
                                {task.category && <span className="badge badge-gray text-xs">{task.category}</span>}
                                {task.dueDate && <span className={`text-xs ${dueDateColor(task.dueDate, task.status)}`}>📅 {fmtDate(task.dueDate)}</span>}
                                {task.reminderEnabled && <span className="text-xs text-yellow-500">🔔 Reminder set</span>}
                                {task.linkedSegment !== 'none' && <span className="badge badge-blue text-xs">🔗 {task.linkedSegment}</span>}
                              </div>

                              {/* Subtask progress bar */}
                              {progress && (
                                <div className="mt-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                      <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${progress.percent}%` }} />
                                    </div>
                                    <button onClick={() => toggleExpand(task._id)}
                                      className="text-xs text-primary-600 hover:underline flex-shrink-0">
                                      {progress.done}/{progress.total} subtasks {isExpanded ? '▲' : '▼'}
                                    </button>
                                  </div>
                                </div>
                              )}
                              {/* Add subtask button when no subtasks */}
                              {(!task.subtasks || task.subtasks.length === 0) && can('tasks', 'edit') && (
                                <button onClick={() => { setShowSubtaskForm(task._id); setEditSubtask(null); setSubtaskForm({ title: '', description: '', priority: 'p3', dueDate: '', status: 'todo', reminderEnabled: false, reminderDate: '', reminderTime: '' }) }}
                                  className="mt-2 text-xs text-slate-400 hover:text-primary-600 hover:underline">
                                  + Add subtask
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Subtasks */}
                        {isExpanded && task.subtasks && task.subtasks.length > 0 && (
                          <div className="bg-slate-50/80 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700">
                            <div className="px-4 py-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subtasks</span>
                              {can('tasks', 'edit') && (
                                <button onClick={() => { setShowSubtaskForm(task._id); setEditSubtask(null); setSubtaskForm({ title: '', description: '', priority: 'p3', dueDate: '', status: 'todo', reminderEnabled: false, reminderDate: '', reminderTime: '' }) }}
                                  className="text-xs text-primary-600 hover:underline">+ Add</button>
                              )}
                            </div>
                            {task.subtasks.map(st => (
                              <div key={st._id} className="flex items-start gap-3 px-6 py-2.5 border-t border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800/50">
                                {/* Subtask status dot */}
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${st.status === 'done' ? 'bg-green-500' : st.status === 'in_progress' ? 'bg-blue-500' : st.status === 'on_hold' ? 'bg-yellow-500' : 'bg-slate-300'}`} />
                                <div className="flex-1 min-w-0">
                                  <span className={`text-sm ${st.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{st.title}</span>
                                  {st.description && <p className="text-xs text-slate-400 mt-0.5">{st.description}</p>}
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`badge text-xs ${priorityColor[st.priority]}`}>{priorityLabel[st.priority]?.split(' ')[0]}</span>
                                    {st.dueDate && <span className={`text-xs ${dueDateColor(st.dueDate, st.status)}`}>📅 {fmtDate(st.dueDate)}</span>}
                                    {st.reminderEnabled && <span className="text-xs text-yellow-500">🔔</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {/* Subtask status selector */}
                                  <select value={st.status}
                                    onChange={e => handleSubtaskStatusChange(task._id, st._id, e.target.value)}
                                    className="text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 rounded px-1.5 py-0.5 text-slate-600 dark:text-slate-300 cursor-pointer">
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="done">Done</option>
                                  </select>
                                  {can('tasks', 'edit') && (
                                    <button onClick={() => {
                                      setEditSubtask(st)
                                      setShowSubtaskForm(task._id)
                                      setSubtaskForm({
                                        title: st.title, description: st.description || '', priority: st.priority || 'p3',
                                        dueDate: st.dueDate ? new Date(st.dueDate).toISOString().slice(0, 10) : '',
                                        status: st.status, reminderEnabled: st.reminderEnabled || false,
                                        reminderDate: st.reminder?.datetime ? new Date(st.reminder.datetime).toISOString().slice(0, 10) : '',
                                        reminderTime: st.reminder?.datetime ? new Date(st.reminder.datetime).toTimeString().slice(0, 5) : ''
                                      })
                                    }} className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-500 text-xs">✏️</button>
                                  )}
                                  {can('tasks', 'delete') && (
                                    <button onClick={() => setDeleteSubtask({ taskId: task._id, subtaskId: st._id })}
                                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500 text-xs">🗑️</button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {view === 'kanban' && (
            <KanbanView tasks={tasks} onStatusChange={handleStatusChange}
              onEdit={t => { setEditTask(t); setShowForm(true) }} onDelete={setDeleteId} can={can} />
          )}

          {view === 'calendar' && <CalendarView tasks={tasks} />}
        </>
      )}

      {/* Task Form */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditTask(null) }}
        title={editTask ? 'Edit Task' : 'New Task'} size="lg">
        <TaskForm task={editTask} onSuccess={() => { setShowForm(false); setEditTask(null); fetchData() }} />
      </Modal>

      {/* Subtask Form */}
      <Modal open={!!showSubtaskForm} onClose={() => { setShowSubtaskForm(null); setEditSubtask(null) }}
        title={editSubtask ? 'Edit Subtask' : 'Add Subtask'} size="sm">
        <form onSubmit={handleSubtaskSave} className="space-y-4">
          <div>
            <label className="label">Title <span className="text-red-500">*</span></label>
            <input className="input" value={subtaskForm.title} onChange={e => setSubtaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Subtask title" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input h-16 resize-none" value={subtaskForm.description} onChange={e => setSubtaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={subtaskForm.priority} onChange={e => setSubtaskForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="p1">🔴 Critical</option>
                <option value="p2">🟠 High</option>
                <option value="p3">🔵 Medium</option>
                <option value="p4">⚪ Low</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={subtaskForm.status} onChange={e => setSubtaskForm(f => ({ ...f, status: e.target.value }))}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input className="input" type="date" value={subtaskForm.dueDate} onChange={e => setSubtaskForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          {/* Reminder */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="stReminder" checked={subtaskForm.reminderEnabled}
                onChange={e => setSubtaskForm(f => ({ ...f, reminderEnabled: e.target.checked }))}
                className="w-4 h-4 accent-primary-600" />
              <label htmlFor="stReminder" className="text-sm font-medium text-yellow-700 dark:text-yellow-400 cursor-pointer">🔔 Set Reminder</label>
            </div>
            {subtaskForm.reminderEnabled && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-xs">Date</label>
                  <input className="input" type="date" value={subtaskForm.reminderDate} onChange={e => setSubtaskForm(f => ({ ...f, reminderDate: e.target.value }))} />
                </div>
                <div>
                  <label className="label text-xs">Time</label>
                  <input className="input" type="time" value={subtaskForm.reminderTime} onChange={e => setSubtaskForm(f => ({ ...f, reminderTime: e.target.value }))} />
                </div>
              </div>
            )}
          </div>
          <button type="submit" className="btn-primary w-full justify-center">
            {editSubtask ? '✅ Update Subtask' : '➕ Add Subtask'}
          </button>
        </form>
      </Modal>

      <Confirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)}
        title="Delete Task" message="This will delete the task and all its subtasks." danger />

      <Confirm open={!!deleteSubtask} onClose={() => setDeleteSubtask(null)}
        onConfirm={() => { handleSubtaskDelete(deleteSubtask.taskId, deleteSubtask.subtaskId); setDeleteSubtask(null) }}
        title="Delete Subtask" message="Remove this subtask?" danger />
    </div>
  )
}
