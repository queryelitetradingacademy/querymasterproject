import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { Modal, FormField, Select, Spinner, Empty, Confirm } from '../../components/common'
import { fmtCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const WALLET_ICONS = { upi: '📱', cash: '💵', bank: '🏦', card: '💳', crypto: '₿', other: '💰' }
const WALLET_TYPES = [
  { label: 'UPI (GPay, PhonePe, Paytm)', value: 'upi' },
  { label: 'Cash', value: 'cash' },
  { label: 'Bank Account', value: 'bank' },
  { label: 'Credit/Debit Card', value: 'card' },
  { label: 'Crypto/USDT', value: 'crypto' },
  { label: 'Other', value: 'other' },
]

const DEFAULT_WALLETS = [
  { name: 'GPay', key: 'gpay', type: 'upi', icon: '📱', color: '#4285F4' },
  { name: 'PhonePe', key: 'phonepe', type: 'upi', icon: '📱', color: '#5f259f' },
  { name: 'Paytm', key: 'paytm', type: 'upi', icon: '📱', color: '#002970' },
  { name: 'Cash', key: 'cash', type: 'cash', icon: '💵', color: '#22c55e' },
  { name: 'Bank Transfer', key: 'bank_transfer', type: 'bank', icon: '🏦', color: '#0ea5e9' },
  { name: 'Razorpay', key: 'razorpay', type: 'upi', icon: '💳', color: '#3395FF' },
]

export default function WalletTracker() {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editWallet, setEditWallet] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ name: '', key: '', type: 'upi', openingBalance: 0, icon: '💳', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/wallets')
      setWallets(res.data.data)
    } catch {}
    setLoading(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.key) return toast.error('Name and key required')
    setSaving(true)
    try {
      if (editWallet) await api.put(`/wallets/${editWallet._id}`, form)
      else await api.post('/wallets', form)
      toast.success(editWallet ? 'Wallet updated!' : 'Wallet added!')
      setShowForm(false); setEditWallet(null)
      fetchData()
    } catch {}
    setSaving(false)
  }

  const handleDelete = async (id) => {
    try { await api.delete(`/wallets/${id}`); toast.success('Wallet removed'); fetchData() } catch {}
  }

  const addDefaultWallets = async () => {
    setSaving(true)
    try {
      for (const w of DEFAULT_WALLETS) {
        await api.post('/wallets', { ...w, openingBalance: 0 }).catch(() => {})
      }
      toast.success('Default wallets added!')
      fetchData()
    } catch {}
    setSaving(false)
  }

  const totalBalance = wallets.reduce((s, w) => s + (w.currentBalance || 0), 0)

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="card p-5 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-primary-700 dark:text-primary-400 font-medium">Total Available Balance</div>
            <div className="text-3xl font-bold text-primary-900 dark:text-primary-200 mt-1">{fmtCurrency(totalBalance)}</div>
            <div className="text-xs text-primary-600 dark:text-primary-400 mt-1">Across {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="text-4xl">💰</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="section-title">Wallet Balances</h3>
        <div className="flex gap-2">
          {wallets.length === 0 && (
            <button onClick={addDefaultWallets} disabled={saving} className="btn-secondary text-xs">
              ⚡ Add Default Wallets
            </button>
          )}
          <button onClick={() => { setForm({ name: '', key: '', type: 'upi', openingBalance: 0, icon: '💳', notes: '' }); setEditWallet(null); setShowForm(true) }}
            className="btn-primary">➕ Add Wallet</button>
        </div>
      </div>

      {wallets.length === 0 ? (
        <Empty icon="💳" title="No wallets added" desc="Add wallets to track your available balance per payment method"
          action={<button onClick={addDefaultWallets} className="btn-primary">⚡ Add Default Wallets</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map(wallet => (
            <div key={wallet._id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{wallet.icon || WALLET_ICONS[wallet.type] || '💳'}</span>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{wallet.name}</div>
                    <div className="text-xs text-slate-400 capitalize">{wallet.type}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditWallet(wallet); setForm({ name: wallet.name, key: wallet.key, type: wallet.type, openingBalance: wallet.openingBalance || 0, icon: wallet.icon || '💳', notes: wallet.notes || '' }); setShowForm(true) }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-sm">✏️</button>
                  <button onClick={() => setDeleteId(wallet._id)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm">🗑️</button>
                </div>
              </div>

              {/* Balance */}
              <div className={`text-2xl font-bold ${(wallet.currentBalance || 0) >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600'}`}>
                {fmtCurrency(wallet.currentBalance || 0)}
              </div>

              {/* Breakdown */}
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Opening Balance</span>
                  <span className="text-slate-500">{fmtCurrency(wallet.openingBalance || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total In</span>
                  <span className="text-green-600">+ {fmtCurrency(wallet.income || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Out</span>
                  <span className="text-red-500">- {fmtCurrency(wallet.expense || 0)}</span>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700 pt-1.5 flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Net Balance</span>
                  <span className={wallet.currentBalance >= 0 ? 'text-primary-600' : 'text-red-600'}>{fmtCurrency(wallet.currentBalance || 0)}</span>
                </div>
              </div>

              {wallet.notes && (
                <div className="mt-2 text-xs text-slate-400 italic">{wallet.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditWallet(null) }}
        title={editWallet ? 'Edit Wallet' : 'Add Wallet'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Wallet Name" required>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. GPay, HDFC Bank, Cash" />
          </FormField>
          <FormField label="Wallet Key (no spaces)" required>
            <input className="input font-mono" value={form.key}
              onChange={e => set('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="e.g. gpay, hdfc_bank, cash"
              disabled={!!editWallet} />
            <p className="text-xs text-slate-400 mt-1">Must match payment mode used in transactions</p>
          </FormField>
          <FormField label="Type">
            <Select value={form.type} onChange={e => set('type', e.target.value)} options={WALLET_TYPES} />
          </FormField>
          <FormField label="Opening Balance (₹)">
            <input className="input" type="number" value={form.openingBalance}
              onChange={e => set('openingBalance', Number(e.target.value))} placeholder="Current balance before tracking" />
            <p className="text-xs text-slate-400 mt-1">Enter how much you already have in this wallet</p>
          </FormField>
          <FormField label="Icon (emoji)">
            <input className="input" value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="💳" maxLength={2} />
          </FormField>
          <FormField label="Notes">
            <input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" />
          </FormField>
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
            {saving ? '⏳ Saving...' : editWallet ? '✅ Update Wallet' : '➕ Add Wallet'}
          </button>
        </form>
      </Modal>

      <Confirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)}
        title="Remove Wallet" message="This removes the wallet tracker. Your transactions are not deleted." danger />
    </div>
  )
}
