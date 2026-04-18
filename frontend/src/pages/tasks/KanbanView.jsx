// KanbanView.jsx
import { fmtDate, priorityColor, priorityLabel, dueDateColor } from '../../utils/helpers'

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-400' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'on_hold', label: 'On Hold', color: 'bg-yellow-500' },
  { id: 'done', label: 'Done', color: 'bg-green-500' },
]

export default function KanbanView({ tasks, onStatusChange, onEdit, onDelete, can }) {
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id)
    return acc
  }, {})

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map(col => (
        <div key={col.id} className="kanban-col">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.label}</span>
            <span className="ml-auto text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">{grouped[col.id]?.length || 0}</span>
          </div>
          <div className="space-y-2 min-h-[100px]">
            {grouped[col.id]?.map(task => (
              <div key={task._id} className="kanban-card">
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">{task.title}</span>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {can('tasks', 'edit') && <button onClick={() => onEdit(task)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xs">✏️</button>}
                    {can('tasks', 'delete') && <button onClick={() => onDelete(task._id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-xs">🗑️</button>}
                  </div>
                </div>
                {task.description && <p className="text-xs text-slate-400 mb-2 line-clamp-2">{task.description}</p>}
                <div className="flex items-center justify-between">
                  <span className={`badge text-xs ${priorityColor[task.priority]}`}>{priorityLabel[task.priority]?.split(' ')[0]}</span>
                  {task.dueDate && <span className={`text-xs ${dueDateColor(task.dueDate, task.status)}`}>{fmtDate(task.dueDate)}</span>}
                </div>
                {task.subtasks?.length > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1">
                      <div className="bg-primary-500 h-1 rounded-full" style={{ width: `${(task.subtasks.filter(s => s.status === 'done').length / task.subtasks.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5">{task.subtasks.filter(s => s.status === 'done').length}/{task.subtasks.length}</span>
                  </div>
                )}
                {col.id !== 'done' && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {COLUMNS.filter(c => c.id !== col.id).map(c => (
                      <button key={c.id} onClick={() => onStatusChange(task._id, c.id)}
                        className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors">
                        → {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
