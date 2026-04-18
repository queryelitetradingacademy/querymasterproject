import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns'

export const fmtDate = (d) => d ? format(new Date(d), 'dd MMM yyyy') : '—'
export const fmtDateTime = (d) => d ? format(new Date(d), 'dd MMM yyyy, hh:mm a') : '—'
export const fmtRelative = (d) => d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '—'
export const fmtCurrency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)
export const fmtNumber = (n) => new Intl.NumberFormat('en-IN').format(n || 0)

export const dueDateColor = (date, status) => {
  if (status === 'done') return 'text-green-600'
  if (!date) return 'text-slate-500'
  const d = new Date(date)
  if (isPast(d)) return 'text-red-600 font-semibold'
  if (isToday(d)) return 'text-orange-600 font-semibold'
  if (isTomorrow(d)) return 'text-yellow-600'
  return 'text-slate-600 dark:text-slate-400'
}

export const priorityLabel = { p1: '🔴 Critical', p2: '🟠 High', p3: '🔵 Medium', p4: '⚪ Low' }
export const priorityColor = { p1: 'badge-red', p2: 'badge-yellow', p3: 'badge-blue', p4: 'badge-gray' }
export const statusLabel = { todo: 'To Do', in_progress: 'In Progress', on_hold: 'On Hold', done: 'Done' }
export const statusColor = { todo: 'badge-gray', in_progress: 'badge-blue', on_hold: 'badge-yellow', done: 'badge-green' }
export const bookLabel = { personal: 'Personal', education_business: 'Education Business', trading_business: 'Trading Business' }
export const bookColor = { personal: 'badge-blue', education_business: 'badge-purple', trading_business: 'badge-yellow' }
export const conversionColor = { poor: 'badge-red', good: 'badge-yellow', very_good: 'badge-green' }
export const studentStatusColor = { lead: 'badge-blue', pending: 'badge-yellow', converted: 'badge-green', lost: 'badge-red' }

export const getCurrentFY = () => {
  const now = new Date()
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `${y}-${String(y + 1).slice(2)}`
}

export const getFYOptions = () => {
  const current = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => {
    const y = current - i
    return { label: `FY ${y}-${String(y + 1).slice(2)}`, value: `${y}-${String(y + 1).slice(2)}` }
  })
}

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const monthOptions = MONTHS.map((m, i) => ({ label: m, value: i + 1 }))
