import { useState, useEffect } from 'react'
import { getTransactions, deleteTransaction, getFinanceSummary, getNetWorth } from '../../api/finance'
import { exportFinance, downloadBlob } from '../../api/export'
import { Modal, Confirm, Spinner, Empty, SearchInput, Tabs, StatCard } from '../../components/common'
import { fmtDate, fmtCurrency, bookLabel, bookColor, getCurrentFY, getFYOptions, monthOptions } from '../../utils/helpers'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import TransactionForm from './TransactionForm'
import InvestmentsTab from './InvestmentsTab'
import ITRTab from './ITRTab'
import NetWorthTab from './NetWorthTab'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const mainTabs = [
  { value: 'transactions', label: 'Transactions', icon: '₹' },
  { value: 'investments', label: 'Portfolio', icon: '📈' },
  { value: 'itr', label: 'ITR & Tax', icon: '📋' },
  { value: 'networth', label: 'Net Worth', icon: '🏦' },
]

const bookTabs = [
  { value: '', label: 'All Books' },
  { value: 'personal', label: 'Personal' },
  { value: 'education_business', label: 'Education' },
  { value: 'trading_business', label: 'Trading' },
]

export default function FinancePage() {
  const [tab, setTab] = useState('transactions')
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [netWorth, setNetWorth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [book, setBook] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [fy, setFy] = useState(getCurrentFY())
  const [showForm, setShowForm] = useState(false)
  const [editTx, setEditTx] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { can } = useAuthStore()

  useEffect(() => { if (tab === 'transactions') fetchData() }, [tab, book, typeFilter, fy, search, page])
  useEffect(() => { fetchSummary() }, [book, fy])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 30, search, financialYear: fy }
      if (book) params.book = book
      if (typeFilter) params.type = typeFilter
      const res = await getTransactions(params)
      setTransactions(res.data.data)
      setTotal(res.data.total)
    } catch {}
    setLoading(false)
  }

  const fetchSummary = async () => {
    try {
      const [sumRes, nwRes] = await Promise.all([
        getFinanceSummary({ book, financialYear: fy }),
        getNetWorth()
      ])
      setSummary(sumRes.data.data)
      setNetWorth(nwRes.data.data)
    } catch {}
  }

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id)
      toast.success('Deleted')
      fetchData()
    } catch {}
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const now = new Date()
      const res = await exportFinance({ month: now.getMonth() + 1, year: now.getFullYear(), type: 'monthly', book })
      downloadBlob(res.data, `Finance_${now.getMonth() + 1}_${now.getFullYear()}.xlsx`)
      toast.success('Exported!')
    } catch { toast.error('Export failed') }
    setExportLoading(false)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Finance & ITR</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Track income, expenses, investments and tax</p>
        </div>
        <div className="flex items-center gap-2">
          {can('finance', 'export') && (
            <button onClick={handleExport} disabled={exportLoading} className="btn-secondary">
              {exportLoading ? '⏳' : '📥'} Export
            </button>
          )}
          {can('finance', 'create') && tab === 'transactions' && (
            <button onClick={() => { setEditTx(null); setShowForm(true) }} className="btn-primary">➕ Add Transaction</button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon="💰" label="Total Income" value={fmtCurrency(summary.income)} color="green" />
          <StatCard icon="💸" label="Total Expense" value={fmtCurrency(summary.expense)} color="red" />
          <StatCard icon="🏦" label="Balance" value={fmtCurrency(summary.balance)} color={summary.balance >= 0 ? 'green' : 'red'} />
          {netWorth && <StatCard icon="📊" label="Net Worth" value={fmtCurrency(netWorth.netWorth)} color="purple" />}
        </div>
      )}

      {/* Main Tabs */}
      <Tabs tabs={mainTabs} active={tab} onChange={setTab} />

      {tab === 'transactions' && (
        <>
          {/* Filters */}
          <div className="card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Tabs tabs={bookTabs} active={book} onChange={v => { setBook(v); setPage(1) }} />
              <div className="flex gap-2">
                <select className="input w-32" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <select className="input w-40" value={fy} onChange={e => setFy(e.target.value)}>
                  {getFYOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search transactions..." />
          </div>

          {/* Chart */}
          {summary?.monthlyTrend && summary.monthlyTrend.length > 0 && (
            <div className="card p-5">
              <h3 className="section-title mb-4">Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={buildChart(summary.monthlyTrend)}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => fmtCurrency(v)} />
                  <Bar dataKey="income" fill="#22c55e" radius={[3,3,0,0]} name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" radius={[3,3,0,0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Transactions Table */}
          <div className="card overflow-hidden">
            {loading ? <Spinner /> : transactions.length === 0 ? (
              <Empty icon="₹" title="No transactions" desc="Add your first transaction"
                action={can('finance', 'create') && <button onClick={() => setShowForm(true)} className="btn-primary">➕ Add Transaction</button>} />
            ) : (
              <>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Book</th>
                        <th>Category</th>
                        <th>Payment</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx._id}>
                          <td className="text-xs">{fmtDate(tx.date)}</td>
                          <td>
                            <div className="font-medium text-slate-800 dark:text-slate-200">{tx.description || tx.source || tx.expenseHead || '—'}</div>
                            {tx.notes && <div className="text-xs text-slate-400 truncate max-w-[200px]">{tx.notes}</div>}
                          </td>
                          <td><span className={`badge ${bookColor[tx.book]} text-xs`}>{bookLabel[tx.book]}</span></td>
                          <td className="text-xs text-slate-500">{tx.category || '—'}</td>
                          <td className="text-xs capitalize">{tx.paymentMode?.replace('_', ' ')}</td>
                          <td>
                            <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'income' ? '+' : '-'}{fmtCurrency(tx.amount)}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-1">
                              {can('finance', 'edit') && (
                                <button onClick={() => { setEditTx(tx); setShowForm(true) }} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-500 text-sm">✏️</button>
                              )}
                              {can('finance', 'delete') && (
                                <button onClick={() => setDeleteId(tx._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500 text-sm">🗑️</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {total > 30 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500">{total} transactions total</span>
                    <div className="flex gap-2">
                      <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-3 py-1.5 disabled:opacity-40">← Prev</button>
                      <button disabled={page * 30 >= total} onClick={() => setPage(p => p + 1)} className="btn-secondary px-3 py-1.5 disabled:opacity-40">Next →</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {tab === 'investments' && <InvestmentsTab />}
      {tab === 'itr' && <ITRTab />}
      {tab === 'networth' && <NetWorthTab />}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditTx(null) }}
        title={editTx ? 'Edit Transaction' : 'New Transaction'} size="lg">
        <TransactionForm tx={editTx} onSuccess={() => { setShowForm(false); setEditTx(null); fetchData(); fetchSummary() }} />
      </Modal>

      <Confirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)}
        title="Delete Transaction" message="This will permanently delete this transaction." danger />
    </div>
  )
}

function buildChart(data) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const map = {}
  data.forEach(d => {
    const key = `${months[d._id.month - 1]}`
    if (!map[key]) map[key] = { month: key, income: 0, expense: 0 }
    map[key][d._id.type] = d.total
  })
  return Object.values(map).slice(-6)
}
