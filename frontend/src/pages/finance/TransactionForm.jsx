import { useState, useEffect } from 'react'
import { createTransaction, updateTransaction } from '../../api/finance'
import { getSettings } from '../../api/admin'
import { FormField, Select } from '../../components/common'
import toast from 'react-hot-toast'

const DEFAULTS = {
  type: 'income', amount: '', date: new Date().toISOString().slice(0, 10),
  book: 'personal', category: '', source: '', expenseHead: '',
  paymentMode: 'upi', account: '', description: '', notes: '',
  tradeType: '', symbol: '', buyPrice: '', sellPrice: '', quantity: '',
  brokerage: '', tdsDeducted: '', referenceNumber: '', isRecurring: false
}

export default function TransactionForm({ tx, onSuccess }) {
  const [form, setForm] = useState(tx ? { ...DEFAULTS, ...tx, date: tx.date ? new Date(tx.date).toISOString().slice(0, 10) : DEFAULTS.date } : DEFAULTS)
  const [loading, setLoading] = useState(false)
  const [incSources, setIncSources] = useState([])
  const [expCats, setExpCats] = useState([])
  const [payModes, setPayModes] = useState([])
  const [accounts, setAccounts] = useState([])

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    try {
      const res = await getSettings({ category: 'finance' })
      const s = res.data.data
      setIncSources(s.find(x => x.key === 'income_sources')?.values.filter(v => v.isActive) || [])
      setExpCats(s.find(x => x.key === 'expense_categories')?.values.filter(v => v.isActive) || [])
      setPayModes(s.find(x => x.key === 'payment_modes')?.values.filter(v => v.isActive) || [])
      setAccounts(s.find(x => x.key === 'bank_accounts')?.values.filter(v => v.isActive) || [])
    } catch {}
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.date) return toast.error('Amount and date required')
    setLoading(true)
    try {
      if (tx) await updateTransaction(tx._id, form)
      else await createTransaction(form)
      toast.success(tx ? 'Updated!' : 'Transaction added!')
      onSuccess()
    } catch {}
    setLoading(false)
  }

  const isTrading = form.book === 'trading_business'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="form-grid">
        <FormField label="Type" required>
          <Select value={form.type} onChange={e => set('type', e.target.value)}
            options={[{ label: '💰 Income', value: 'income' }, { label: '💸 Expense', value: 'expense' }]} />
        </FormField>
        <FormField label="Amount (₹)" required>
          <input className="input" type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
        </FormField>
        <FormField label="Date" required>
          <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </FormField>
        <FormField label="Book" required>
          <Select value={form.book} onChange={e => set('book', e.target.value)}
            options={[{ label: 'Personal', value: 'personal' }, { label: 'Education Business', value: 'education_business' }, { label: 'Trading Business', value: 'trading_business' }]} />
        </FormField>
        {form.type === 'income' ? (
          <FormField label="Income Source">
            <Select value={form.source} onChange={e => set('source', e.target.value)}
              options={incSources.map(s => ({ label: s.label, value: s.value }))} placeholder="Select source" />
          </FormField>
        ) : (
          <FormField label="Expense Category">
            <Select value={form.expenseHead} onChange={e => set('expenseHead', e.target.value)}
              options={expCats.map(c => ({ label: c.label, value: c.value }))} placeholder="Select category" />
          </FormField>
        )}
        <FormField label="Payment Mode">
          <Select value={form.paymentMode} onChange={e => set('paymentMode', e.target.value)}
            options={payModes.length ? payModes.map(m => ({ label: m.label, value: m.value })) : [
              { label: 'Cash', value: 'cash' }, { label: 'UPI', value: 'upi' }, { label: 'GPay', value: 'gpay' },
              { label: 'Bank Transfer', value: 'bank_transfer' }, { label: 'Razorpay', value: 'razorpay' }
            ]} />
        </FormField>
        <FormField label="Account">
          <Select value={form.account} onChange={e => set('account', e.target.value)}
            options={accounts.map(a => ({ label: a.label, value: a.value }))} placeholder="Select account" />
        </FormField>
        <FormField label="Description">
          <input className="input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description" />
        </FormField>
      </div>

      {isTrading && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 pb-1 border-b border-slate-200 dark:border-slate-700">Trading Details</h4>
          <div className="form-grid">
            <FormField label="Trade Type">
              <Select value={form.tradeType} onChange={e => set('tradeType', e.target.value)}
                options={[
                  { label: 'Intraday (MIS)', value: 'intraday' }, { label: 'Swing', value: 'swing' },
                  { label: 'F&O', value: 'fno' }, { label: 'Long Term Equity', value: 'lt_equity' },
                  { label: 'Mutual Fund', value: 'mf' }, { label: 'USDT/Crypto', value: 'usdt' },
                  { label: 'Brokerage Income', value: 'brokerage' }
                ]} placeholder="Select type" />
            </FormField>
            <FormField label="Symbol / Scrip">
              <input className="input" value={form.symbol} onChange={e => set('symbol', e.target.value)} placeholder="NIFTY, RELIANCE..." />
            </FormField>
            <FormField label="Buy Price">
              <input className="input" type="number" step="0.01" value={form.buyPrice} onChange={e => set('buyPrice', e.target.value)} />
            </FormField>
            <FormField label="Sell Price">
              <input className="input" type="number" step="0.01" value={form.sellPrice} onChange={e => set('sellPrice', e.target.value)} />
            </FormField>
            <FormField label="Quantity">
              <input className="input" type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </FormField>
            <FormField label="Brokerage Paid">
              <input className="input" type="number" value={form.brokerage} onChange={e => set('brokerage', e.target.value)} />
            </FormField>
          </div>
        </div>
      )}

      <div className="form-grid">
        <FormField label="TDS Deducted (₹)">
          <input className="input" type="number" value={form.tdsDeducted} onChange={e => set('tdsDeducted', e.target.value)} placeholder="0" />
        </FormField>
        <FormField label="Reference Number">
          <input className="input" value={form.referenceNumber} onChange={e => set('referenceNumber', e.target.value)} placeholder="UTR/Txn ID" />
        </FormField>
      </div>

      <FormField label="Notes">
        <textarea className="input h-20 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." />
      </FormField>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
        {loading ? '⏳ Saving...' : tx ? '✅ Update Transaction' : '➕ Add Transaction'}
      </button>
    </form>
  )
}
