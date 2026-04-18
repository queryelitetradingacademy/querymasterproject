import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { priorityColor } from '../../utils/helpers'

export default function CalendarView({ tasks }) {
  const [current, setCurrent] = useState(new Date())

  const start = startOfWeek(startOfMonth(current), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(current), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })

  const getTasksForDay = (day) => tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day))

  const prev = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const next = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <button onClick={prev} className="btn-ghost px-3">←</button>
        <h3 className="font-semibold text-slate-800 dark:text-white">{format(current, 'MMMM yyyy')}</h3>
        <button onClick={next} className="btn-ghost px-3">→</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="p-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayTasks = getTasksForDay(day)
          const isCurrentMonth = day.getMonth() === current.getMonth()
          const todayClass = isToday(day) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
          return (
            <div key={i} className={`min-h-[80px] p-1.5 border-b border-r border-slate-100 dark:border-slate-800 ${todayClass} ${!isCurrentMonth ? 'opacity-40' : ''}`}>
              <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-primary-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map(task => (
                  <div key={task._id} className={`text-xs px-1 py-0.5 rounded truncate ${task.status === 'done' ? 'line-through opacity-50 bg-slate-100 dark:bg-slate-800' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300'}`}>
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && <div className="text-xs text-slate-400 pl-1">+{dayTasks.length - 3} more</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
