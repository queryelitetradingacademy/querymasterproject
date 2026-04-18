import { useState, useEffect } from 'react'
import { getInvestments, createInvestment, updateInvestment, deleteInvestment, getTaxDeductions, createTaxDeduction, updateTaxDeduction, deleteTaxDeduction, getNetWorth } from '../../api/finance'
import { Modal, Confirm, Spinner, Empty, FormField, Select, StatCard } from '../../components/common'
import { fmtCurrency, fmtDate, getCurrentFY, getFYOptions } from '../../utils/helpers'
import toast from 'react-hot-toast'

// ===================== INVESTMENTS TAB =====================
export function InvestmentsTab() {
  const [investments, setInvestments] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editInv, setEditInv] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'stock', symbol: '', units: '', buyPrice: '', currentPrice: '', investedAmount: '', currentValue: '', purchaseDate: '', notes: '', book: 'personal' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getInvestments()
      setInvestments(res.data.data)
      setSummary({ totalInvested: res.data.totalInvested, totalCurrent: res.data.totalCurrent, totalGainLoss: res.data.totalGainLoss })
    } catch {}
    setLoading(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const gainLoss = (form.currentValue || form.investedAmount) - form.investedAmount
      const payload = { ...form, gainLoss, gainLossPercent: form.investedAmount ? (gainLoss / form.investedAmount) * 100 : 0 }
      if (editInv) await updateInvestment(editInv._id, payload)
      else await createInvestment(payload)
      toast.success(editInv ? 'Updated!' : 'Investment added!')
      setShowForm(false); setEditInv(null)
      fetchData()
    } catch {}
  }

  const handleDelete = async (id) => {
    try { await deleteInvestment(id); toast.success('Deleted'); fetchData() } catch {}
  }

  const TYPES = ['stock', 'mutual_fund', 'crypto', 'usdt', 'fd', 'ppf', 'epf', 'nps', 'real_estate', 'gold', 'other']

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="💰" label="Total Invested" value={fmtCurrency(summary.totalInvested)} color="blue" />
        <StatCard icon="📈" label="Current Value" value={fmtCurrency(summary.totalCurrent)} color="green" />
        <StatCard icon="📊" label="Gain / Loss" value={fmtCurrency(summary.totalGainLoss)} color={summary.totalGainLoss >= 0 ? 'green' : 'red'} />
      </div>
      <div className="flex justify-end">
        <button onClick={() => { setForm({ name: '', type: 'stock', symbol: '', units: '', buyPrice: '', currentPrice: '', investedAmount: '', currentValue: '', purchaseDate: '', notes: '', book: 'personal' }); setEditInv(null); setShowForm(true) }} className="btn-primary">➕ Add Investment</button>
      </div>
      <div className="card overflow-hidden">
        {investments.length === 0 ? <Empty icon="📈" title="No investments" desc="Add your portfolio" /> : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Name</th><th>Type</th><th>Invested</th><th>Current Value</th><th>Gain/Loss</th><th>Actions</th></tr></thead>
              <tbody>
                {investments.map(inv => (
                  <tr key={inv._id}>
                    <td><div className="font-medium text-slate-800 dark:text-slate-200">{inv.name}</div><div className="text-xs text-slate-400">{inv.symbol}</div></td>
                    <td><span className="badge badge-blue text-xs capitalize">{inv.type.replace('_', ' ')}</span></td>
                    <td className="font-medium">{fmtCurrency(inv.investedAmount)}</td>
                    <td className="font-medium">{fmtCurrency(inv.currentValue || inv.investedAmount)}</td>
                    <td><span className={`font-bold text-sm ${inv.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>{inv.gainLoss >= 0 ? '+' : ''}{fmtCurrency(inv.gainLoss)}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditInv(inv); setForm({ ...inv, purchaseDate: inv.purchaseDate ? new Date(inv.purchaseDate).toISOString().slice(0, 10) : '' }); setShowForm(true) }} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-500 text-sm">✏️</button>
                        <button onClick={() => setDeleteId(inv._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500 text-sm">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditInv(null) }} title={editInv ? 'Edit Investment' : 'Add Investment'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-grid">
            <FormField label="Name" required><input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Investment name" /></FormField>
            <FormField label="Type"><Select value={form.type} onChange={e => set('type', e.target.value)} options={TYPES.map(t => ({ label: t.replace('_', ' ').toUpperCase(), value: t }))} /></FormField>
            <FormField label="Symbol/Ticker"><input className="input" value={form.symbol} onChange={e => set('symbol', e.target.value)} placeholder="e.g. RELIANCE" /></FormField>
            <FormField label="Book"><Select value={form.book} onChange={e => set('book', e.target.value)} options={[{ label: 'Personal', value: 'personal' }, { label: 'Business', value: 'education_business' }, { label: 'Trading', value: 'trading_business' }]} /></FormField>
            <FormField label="Units/Qty"><input className="input" type="number" value={form.units} onChange={e => set('units', e.target.value)} /></FormField>
            <FormField label="Buy Price"><input className="input" type="number" value={form.buyPrice} onChange={e => set('buyPrice', e.target.value)} /></FormField>
            <FormField label="Invested Amount (₹)" required><input className="input" type="number" value={form.investedAmount} onChange={e => set('investedAmount', e.target.value)} /></FormField>
            <FormField label="Current Value (₹)"><input className="input" type="number" value={form.currentValue} onChange={e => set('currentValue', e.target.value)} /></FormField>
            <FormField label="Purchase Date"><input className="input" type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} /></FormField>
          </div>
          <FormField label="Notes"><textarea className="input h-16 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} /></FormField>
          <button type="submit" className="btn-primary w-full justify-center">{editInv ? 'Update' : 'Add Investment'}</button>
        </form>
      </Modal>
      <Confirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} title="Delete Investment" message="Remove this investment record?" danger />
    </div>
  )
}

// ===================== ITR TAB =====================
export function ITRTab() {
  const [deductions, setDeductions] = useState([])
  const [totalDeductions, setTotalDeductions] = useState(0)
  const [fy, setFy] = useState(getCurrentFY())
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editDed, setEditDed] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ section: '80C', description: '', amount: '', maxLimit: '', notes: '', financialYear: getCurrentFY() })

  useEffect(() => { fetchData() }, [fy])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getTaxDeductions({ financialYear: fy })
      setDeductions(res.data.data)
      setTotalDeductions(res.data.totalDeductions)
    } catch {}
    setLoading(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editDed) await updateTaxDeduction(editDed._id, form)
      else await createTaxDeduction({ ...form, financialYear: fy })
      toast.success('Saved!')
      setShowForm(false); setEditDed(null)
      fetchData()
    } catch {}
  }

  const handleDelete = async (id) => {
    try { await deleteTaxDeduction(id); toast.success('Deleted'); fetchData() } catch {}
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="section-title">Tax Deductions</h3>
          <select className="input w-36 py-1.5" value={fy} onChange={e => setFy(e.target.value)}>
            {getFYOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button onClick={() => { setForm({ section: '80C', description: '', amount: '', maxLimit: '', notes: '', financialYear: fy }); setEditDed(null); setShowForm(true) }} className="btn-primary">➕ Add Deduction</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="📋" label="Total Deductions" value={fmtCurrency(totalDeductions)} color="green" />
        <StatCard icon="💡" label="Est. Tax Saved" value={fmtCurrency(totalDeductions * 0.3)} sub="@ 30% slab (approx)" color="blue" />
      </div>

      <div className="card overflow-hidden">
        {deductions.length === 0 ? <Empty icon="📋" title="No deductions" desc="Add your ITR deductions" /> : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Section</th><th>Description</th><th>Amount</th><th>Max Limit</th><th>Notes</th><th>Actions</th></tr></thead>
              <tbody>
                {deductions.map(d => (
                  <tr key={d._id}>
                    <td><span className="badge badge-purple font-mono">{d.section}</span></td>
                    <td className="font-medium text-slate-800 dark:text-slate-200">{d.description}</td>
                    <td className="font-bold text-green-600">{fmtCurrency(d.amount)}</td>
                    <td className="text-slate-500">{d.maxLimit ? fmtCurrency(d.maxLimit) : '—'}</td>
                    <td className="text-xs text-slate-400 max-w-[150px] truncate">{d.notes || '—'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditDed(d); setForm({ ...d }); setShowForm(true) }} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-500 text-sm">✏️</button>
                        <button onClick={() => setDeleteId(d._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500 text-sm">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditDed(null) }} title={editDed ? 'Edit Deduction' : 'Add Deduction'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Section" required>
            <Select value={form.section} onChange={e => set('section', e.target.value)} options={['80C','80D','HRA','80E','home_loan','business_exp','standard','80G'].map(s => ({ label: s, value: s }))} />
          </FormField>
          <FormField label="Description"><input className="input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. LIC Premium, PPF" /></FormField>
          <FormField label="Amount (₹)" required><input className="input" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} /></FormField>
          <FormField label="Max Limit (₹)"><input className="input" type="number" value={form.maxLimit} onChange={e => set('maxLimit', e.target.value)} /></FormField>
          <FormField label="Notes"><textarea className="input h-16 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} /></FormField>
          <button type="submit" className="btn-primary w-full justify-center">{editDed ? 'Update' : 'Add Deduction'}</button>
        </form>
      </Modal>
      <Confirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} title="Delete Deduction" message="Remove this deduction?" danger />
    </div>
  )
}

// ===================== NET WORTH TAB =====================
export default function NetWorthTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getNetWorth().then(r => { setData(r.data.data); setLoading(false) }).catch(() => setLoading(false)) }, [])

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="💰" label="Total Assets" value={fmtCurrency(data?.totalAssets)} color="green" />
        <StatCard icon="💳" label="Total Liabilities" value={fmtCurrency(data?.totalLiabilities)} color="red" />
        <StatCard icon="🏆" label="Net Worth" value={fmtCurrency(data?.netWorth)} color={data?.netWorth >= 0 ? 'purple' : 'red'} />
      </div>
      <div className="card p-6 text-center">
        <div className="text-5xl mb-3">📊</div>
        <h3 className="section-title mb-2">Net Worth Snapshot</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Your net worth is calculated from your investment portfolio vs liabilities. Add more investments in the Portfolio tab to get an accurate picture.</p>
        <div className="mt-6 flex justify-center gap-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{fmtCurrency(data?.totalAssets)}</div>
            <div className="text-xs text-slate-500 mt-1">Assets</div>
          </div>
          <div className="text-4xl text-slate-300 dark:text-slate-600">—</div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{fmtCurrency(data?.totalLiabilities)}</div>
            <div className="text-xs text-slate-500 mt-1">Liabilities</div>
          </div>
          <div className="text-4xl text-slate-300 dark:text-slate-600">=</div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${data?.netWorth >= 0 ? 'text-primary-600' : 'text-red-600'}`}>{fmtCurrency(data?.netWorth)}</div>
            <div className="text-xs text-slate-500 mt-1">Net Worth</div>
          </div>
        </div>
      </div>
    </div>
  )
}
