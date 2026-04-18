// Modal
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${sizes[size]} w-full`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-dark-800 z-10 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// Confirm Dialog
export function Confirm({ open, onClose, onConfirm, title, message, danger }) {
  if (!open) return null
  return (
    <div className="modal-overlay">
      <div className="modal max-w-sm w-full">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
            <span className="text-2xl">{danger ? '⚠️' : '❓'}</span>
          </div>
          <h3 className="text-center font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={() => { onConfirm(); onClose() }} className={`flex-1 justify-center ${danger ? 'btn-danger' : 'btn-primary'}`}>Confirm</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Spinner
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${s[size]} border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
    </div>
  )
}

// Empty state
export function Empty({ icon = '📭', title = 'Nothing here', desc = 'No data found', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">{desc}</div>
      {action}
    </div>
  )
}

// StatCard
export function StatCard({ icon, label, value, sub, color = 'blue', onClick }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  }
  return (
    <div className={`stat-card ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} onClick={onClick}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${colors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{label}</div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{value}</div>
        {sub && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

// Badge
export function Badge({ label, color = 'gray' }) {
  return <span className={`badge badge-${color}`}>{label}</span>
}

// Input wrapper
export function FormField({ label, required, error, children }) {
  return (
    <div>
      {label && <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// Select input
export function Select({ value, onChange, options, placeholder, className = '' }) {
  return (
    <select value={value} onChange={onChange} className={`input ${className}`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// Export button with dropdown
export function ExportBtn({ onExport, loading }) {
  return (
    <button onClick={onExport} disabled={loading} className="btn-secondary">
      {loading ? '⏳' : '📥'} Export Excel
    </button>
  )
}

// Search input
export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className="input pl-9 w-full" />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">×</button>
      )}
    </div>
  )
}

// Tabs
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
      {tabs.map(tab => (
        <button key={tab.value} onClick={() => onChange(tab.value)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active === tab.value
            ? 'bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${active === tab.value ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
