import { useState, useEffect } from 'react'
import { getTasks, createTask, updateTask, deleteTask } from '../../api/tasks'
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
  { value: 'todo', label: 'To Do', icon: '○' },
  { value: 'in_progress', label: 'In Progress', icon: '◑' },
  { value: 'on_hold', label: 'On Hold', icon: '⏸' },
  { value: 'done', label: 'Done', icon: '✓' },
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
      // Compute stats
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
      toast.success(`Task marked as ${statusLabel[status]}`)
    } catch {}
  }

  const handleDelete = async (id) => {
    try {
      await deleteTask(id)
      toast.success('Task deleted')
      fetchData()
    } catch {}
  }

  const handleExport = async () => {
    try {
      const res = await exportTasks({})
      downloadBlob(res.data, 'Tasks.xlsx')
      toast.success('Exported!')
    } catch {}
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Task Organiser</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage tasks, subtasks and reminders</p>
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

      {/* View Toggle + Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-48">
            <Tabs tabs={viewTabs} active={view} onChange={setView} />
          </div>
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search tasks..." />
          </div>
        </div>
        {view === 'list' && <Tabs tabs={statusTabs} active={statusFilter} onChange={setStatusFilter} />}
      </div>

      {/* Views */}
      {loading ? <Spinner /> : (
        <>
          {view === 'list' && (
            <div className="card overflow-hidden">
              {tasks.length === 0 ? (
                <Empty icon="✅" title="No tasks found" desc="Create your first task"
                  action={can('tasks', 'create') && <button onClick={() => setShowForm(true)} className="btn-primary">➕ Add Task</button>} />
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {tasks.map(task => (
                    <div key={task._id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Status toggle */}
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
                              {task.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
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
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`badge text-xs ${priorityColor[task.priority]}`}>{priorityLabel[task.priority]}</span>
                            <span className={`badge text-xs ${statusColor[task.status]}`}>{statusLabel[task.status]}</span>
                            {task.category && <span className="badge badge-gray text-xs">{task.category}</span>}
                            {task.dueDate && <span className={`text-xs ${dueDateColor(task.dueDate, task.status)}`}>📅 {fmtDate(task.dueDate)}</span>}
                            {task.subtasks?.length > 0 && <span className="text-xs text-slate-400">📎 {task.subtasks.filter(s => s.status === 'done').length}/{task.subtasks.length} subtasks</span>}
                            {task.reminderEnabled && <span className="text-xs text-yellow-500">🔔</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'kanban' && (
            <KanbanView tasks={tasks} onStatusChange={handleStatusChange}
              onEdit={(t) => { setEditTask(t); setShowForm(true) }} onDelete={setDeleteId} can={can} />
          )}

          {view === 'calendar' && <CalendarView tasks={tasks} />}
        </>
      )}

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditTask(null) }}
        title={editTask ? 'Edit Task' : 'New Task'} size="lg">
        <TaskForm task={editTask} onSuccess={() => { setShowForm(false); setEditTask(null); fetchData() }} />
      </Modal>

      <Confirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)}
        title="Delete Task" message="This will delete the task and all its subtasks." danger />
    </div>
  )
}
