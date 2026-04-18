import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats } from '../../api/admin'
import { getStudentStats } from '../../api/students'
import { getTaskStats } from '../../api/tasks'
import { getFinanceSummary } from '../../api/finance'
import { StatCard, Spinner } from '../../components/common'
import { fmtCurrency, getCurrentFY } from '../../utils/helpers'
import useAuthStore from '../../store/authStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [finSummary, setFinSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user, isAdmin, can } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const promises = []
      if (isAdmin()) promises.push(getDashboardStats())
      else {
        promises.push(Promise.resolve(null))
      }
      if (can('queries', 'view')) promises.push(getStudentStats())
      if (can('tasks', 'view')) promises.push(getTaskStats())
      if (can('finance', 'view')) promises.push(getFinanceSummary({ financialYear: getCurrentFY() }))

      const results = await Promise.allSettled(promises)
      if (results[0]?.value?.data) setStats(results[0].value.data.data)
      if (results[3]?.value?.data) setFinSummary(results[3].value.data.data)
    } catch {}
    setLoading(false)
  }

  if (loading) return <Spinner />

  const fy = getCurrentFY()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here's what's happening today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats?.queries && can('queries', 'view') && (<>
          <StatCard icon="👥" label="Total Students" value={stats.queries.total} color="blue" onClick={() => navigate('/queries')} />
          <StatCard icon="⏳" label="Pending Queries" value={stats.queries.pending} color="yellow" onClick={() => navigate('/queries?status=pending')} />
          <StatCard icon="✅" label="Converted" value={stats.queries.converted} color="green" onClick={() => navigate('/queries?status=converted')} />
        </>)}
        {stats?.tasks && can('tasks', 'view') && (<>
          <StatCard icon="📋" label="Active Tasks" value={stats.tasks.total} color="indigo" onClick={() => navigate('/tasks')} />
          <StatCard icon="🚨" label="Overdue Tasks" value={stats.tasks.overdue} color="red" onClick={() => navigate('/tasks?filter=overdue')} />
        </>)}
        {finSummary && can('finance', 'view') && (<>
          <StatCard icon="💰" label={`Income (FY ${fy})`} value={fmtCurrency(finSummary.income)} color="green" onClick={() => navigate('/finance')} />
          <StatCard icon="💸" label={`Expense (FY ${fy})`} value={fmtCurrency(finSummary.expense)} color="red" onClick={() => navigate('/finance')} />
          <StatCard icon="🏦" label="Balance" value={fmtCurrency(finSummary.balance)} color={finSummary.balance >= 0 ? 'green' : 'red'} onClick={() => navigate('/finance')} />
        </>)}
      </div>

      {/* Charts Row */}
      {finSummary?.monthlyTrend && finSummary.monthlyTrend.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="section-title mb-4">Monthly Income vs Expense</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={buildMonthlyChart(finSummary.monthlyTrend)}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmtCurrency(v)} />
                <Bar dataKey="income" fill="#22c55e" radius={[4,4,0,0]} name="Income" />
                <Bar dataKey="expense" fill="#ef4444" radius={[4,4,0,0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {finSummary.categoryBreakdown && finSummary.categoryBreakdown.length > 0 && (
            <div className="card p-5">
              <h3 className="section-title mb-4">Expense Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={finSummary.categoryBreakdown.filter(c => c._id.type === 'expense').slice(0, 6)}
                    dataKey="total" nameKey="_id.category" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {['#6366f1','#f59e0b','#ef4444','#10b981','#3b82f6','#8b5cf6'].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip formatter={v => fmtCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {can('queries', 'create') && (
            <button onClick={() => navigate('/queries?action=new')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <span className="text-2xl">👤</span>
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">New Query</span>
            </button>
          )}
          {can('tasks', 'create') && (
            <button onClick={() => navigate('/tasks?action=new')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
              <span className="text-2xl">✅</span>
              <span className="text-xs font-medium text-purple-700 dark:text-purple-400">New Task</span>
            </button>
          )}
          {can('finance', 'create') && (
            <button onClick={() => navigate('/finance?action=new')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
              <span className="text-2xl">₹</span>
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Add Transaction</span>
            </button>
          )}
          {isAdmin() && (
            <button onClick={() => navigate('/admin')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
              <span className="text-2xl">⚙️</span>
              <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Admin Panel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function buildMonthlyChart(data) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const map = {}
  data.forEach(d => {
    const key = `${months[d._id.month - 1]} ${d._id.year}`
    if (!map[key]) map[key] = { month: key, income: 0, expense: 0 }
    map[key][d._id.type] = d.total
  })
  return Object.values(map).slice(-6)
}
