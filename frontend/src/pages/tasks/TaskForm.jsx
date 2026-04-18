import { useState, useEffect } from 'react'
import { createTask, updateTask } from '../../api/tasks'
import { getStudents } from '../../api/students'
import { getSettings } from '../../api/admin'
import { FormField, Select } from '../../components/common'
import toast from 'react-hot-toast'

const DEFAULTS = {
  title: '', description: '', category: '', priority: 'p3', status: 'todo',
  dueDate: '', isRecurring: false, recurringType: 'weekly',
  reminderEnabled: false, reminderDate: '', reminderTime: '',
  reminderChannels: ['inapp'],
  linkedSegment: 'none', linkedStudent: '',
  subtasks: [], tags: ''
}

export default function TaskForm({ task, onSuccess }) {
  const [form, setForm] = useState(task ? {
    ...DEFAULTS, ...task,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
    tags: task.tags?.join(', ') || '',
    reminderDate: task.reminders?.[0]?.datetime ? new Date(task.reminders[0].datetime).toISOString().slice(0, 10) : '',
    reminderTime: task.reminders?.[0]?.datetime ? new Date(task.reminders[0].datetime).toTimeString().slice(0, 5) : '',
    reminderChannels: task.reminders?.[0]?.channels || ['inapp']
  } : DEFAULTS)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [students, setStudents] = useState([])
  const [newSubtask, setNewSubtask] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [settRes, studRes] = await Promise.all([
        getSettings({ category: 'tasks' }),
        getStudents({ limit: 100, status: 'converted' })
      ])
      const catSetting = settRes.data.data.find(s => s.key === 'task_categories')
      if (catSetting) setCategories(catSetting.values.filter(v => v.isActive))
      setStudents(studRes.data.data)
    } catch {}
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addSubtask = () => {
    if (!newSubtask.trim()) return
    setForm(f => ({ ...f, subtasks: [...f.subtasks, { title: newSubtask, status: 'todo' }] }))
    setNewSubtask('')
  }

  const removeSubtask = (i) => setForm(f => ({ ...f, subtasks: f.subtasks.filter((_, idx) => idx !== i) }))

  const toggleChannel = (ch) => {
    setForm(f => ({
      ...f,
      reminderChannels: f.reminderChannels.includes(ch)
        ? f.reminderChannels.filter(c => c !== ch)
        : [...f.reminderChannels, ch]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return toast.error('Title is required')
    setLoading(true)
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || undefined,
        linkedStudent: form.linkedSegment === 'queries' ? form.linkedStudent : undefined,
        reminders: form.reminderEnabled && form.reminderDate ? [{
          datetime: new Date(`${form.reminderDate}T${form.reminderTime || '09:00'}`),
          channels: form.reminderChannels,
          enabled: true
        }] : []
      }
      if (task) await updateTask(task._id, payload)
      else await createTask(payload)
      toast.success(task ? 'Task updated!' : 'Task created!')
      onSuccess()
    } catch {}
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label="Task Title" required>
        <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="What needs to be done?" />
      </FormField>

      <FormField label="Description">
        <textarea className="input h-20 resize-none" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Additional details..." />
      </FormField>

      <div className="form-grid">
        <FormField label="Category">
          <Select value={form.category} onChange={e => set('category', e.target.value)}
            options={categories.map(c => ({ label: c.label, value: c.value }))} placeholder="Select category" />
        </FormField>
        <FormField label="Priority">
          <Select value={form.priority} onChange={e => set('priority', e.target.value)}
            options={[{ label: '🔴 Critical (P1)', value: 'p1' }, { label: '🟠 High (P2)', value: 'p2' }, { label: '🔵 Medium (P3)', value: 'p3' }, { label: '⚪ Low (P4)', value: 'p4' }]} />
        </FormField>
        <FormField label="Status">
          <Select value={form.status} onChange={e => set('status', e.target.value)}
            options={[{ label: 'To Do', value: 'todo' }, { label: 'In Progress', value: 'in_progress' }, { label: 'On Hold', value: 'on_hold' }, { label: 'Done', value: 'done' }]} />
        </FormField>
        <FormField label="Due Date">
          <input className="input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
        </FormField>
        <FormField label="Tags (comma separated)">
          <input className="input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="tag1, tag2, tag3" />
        </FormField>
        <FormField label="Link to Segment">
          <Select value={form.linkedSegment} onChange={e => set('linkedSegment', e.target.value)}
            options={[{ label: 'None', value: 'none' }, { label: 'Student Query', value: 'queries' }, { label: 'Finance', value: 'finance' }]} />
        </FormField>
        {form.linkedSegment === 'queries' && (
          <FormField label="Link to Student">
            <Select value={form.linkedStudent} onChange={e => set('linkedStudent', e.target.value)}
              options={students.map(s => ({ label: `${s.name} — ${s.contact}`, value: s._id }))} placeholder="Select student" />
          </FormField>
        )}
      </div>

      {/* Recurring */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <input type="checkbox" id="recurring" checked={form.isRecurring} onChange={e => set('isRecurring', e.target.checked)} className="w-4 h-4 accent-primary-600" />
        <label htmlFor="recurring" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">Recurring Task</label>
        {form.isRecurring && (
          <Select value={form.recurringType} onChange={e => set('recurringType', e.target.value)}
            options={[{ label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' }, { label: 'Monthly', value: 'monthly' }]}
            className="ml-2 w-32 !py-1.5" />
        )}
      </div>

      {/* Reminder */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="reminder" checked={form.reminderEnabled} onChange={e => set('reminderEnabled', e.target.checked)} className="w-4 h-4 accent-primary-600" />
          <label htmlFor="reminder" className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 cursor-pointer">🔔 Set Reminder</label>
        </div>
        {form.reminderEnabled && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Reminder Date">
              <input className="input" type="date" value={form.reminderDate} onChange={e => set('reminderDate', e.target.value)} />
            </FormField>
            <FormField label="Reminder Time">
              <input className="input" type="time" value={form.reminderTime} onChange={e => set('reminderTime', e.target.value)} />
            </FormField>
            <div className="col-span-2">
              <label className="label">Notify Via</label>
              <div className="flex gap-3">
                {[['inapp', '🔔 In-App'], ['browser', '🌐 Browser'], ['whatsapp', '💬 WhatsApp']].map(([val, lbl]) => (
                  <label key={val} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.reminderChannels.includes(val)} onChange={() => toggleChannel(val)} className="w-3.5 h-3.5 accent-primary-600" />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subtasks */}
      <div>
        <label className="label">Subtasks</label>
        <div className="space-y-2">
          {form.subtasks.map((st, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-xs text-slate-400">#{i + 1}</span>
              <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{st.title}</span>
              <button type="button" onClick={() => removeSubtask(i)} className="text-red-400 hover:text-red-600 text-sm">×</button>
            </div>
          ))}
          <div className="flex gap-2">
            <input className="input flex-1" value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
              placeholder="Add a subtask..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())} />
            <button type="button" onClick={addSubtask} className="btn-secondary px-3">+ Add</button>
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
        {loading ? '⏳ Saving...' : task ? '✅ Update Task' : '➕ Create Task'}
      </button>
    </form>
  )
}
