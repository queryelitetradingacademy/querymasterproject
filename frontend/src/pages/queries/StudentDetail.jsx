import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStudent, addInstallment, addFollowUp } from '../../api/students'
import api from '../../api/axios'
import { Spinner, Modal, FormField, Select, Confirm } from '../../components/common'
import { fmtDate, fmtDateTime, fmtCurrency, conversionColor, studentStatusColor } from '../../utils/helpers'
import toast from 'react-hot-toast'
import StudentForm from './StudentForm'
import useAuthStore from '../../store/authStore'

const followUpStatuses = [
  { label: 'Interested', value: 'interested' },
  { label: 'Not Interested', value: 'not_interested' },
  { label: 'Callback Needed', value: 'callback' },
  { label: 'No Response', value: 'no_response' },
  { label: 'Converted ✅', value: 'converted' },
  { label: 'Lost ❌', value: 'lost' },
]

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = useAuthStore()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showInstallment, setShowInstallment] = useState(false)
  const [editInstallment, setEditInstallment] = useState(null)
  const [deleteInstId, setDeleteInstId] = useState(null)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [showBroker, setShowBroker] = useState(false)
  const [instForm, setInstForm] = useState({ amount: '', mode: 'upi', note: '', date: new Date().toISOString().slice(0, 10), referenceNumber: '' })
  const [fuForm, setFuForm] = useState({ note: '', status: 'callback', date: '' })
  const [brokerForm, setBrokerForm] = useState({ brokerAccountOpened: false, brokerDetails: { brokerName: '', accountNumber: '', dpId: '', clientCode: '', linkedMobile: '', notes: '' } })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getStudent(id)
      setStudent(res.data.data)
      setBrokerForm({
        brokerAccountOpened: res.data.data.brokerAccountOpened || false,
        brokerDetails: res.data.data.brokerDetails || { brokerName: '', accountNumber: '', dpId: '', clientCode: '', linkedMobile: '', notes: '' }
      })
    } catch { navigate('/queries') }
    setLoading(false)
  }

  const handleAddInstallment = async (e) => {
    e.preventDefault()
    if (!instForm.amount) return toast.error('Amount required')
    setSaving(true)
    try {
      if (editInstallment) {
        await api.put(`/students/${id}/installments/${editInstallment._id}`, instForm)
        toast.success('Installment updated & Finance synced!')
      } else {
        await addInstallment(id, instForm)
        toast.success('Installment added & auto-recorded in Finance!')
      }
      setShowInstallment(false)
      setEditInstallment(null)
      setInstForm({ amount: '', mode: 'upi', note: '', date: new Date().toISOString().slice(0, 10), referenceNumber: '' })
      fetchData()
    } catch {}
    setSaving(false)
  }

  const handleDeleteInstallment = async (instId) => {
    try {
      await api.delete(`/students/${id}/installments/${instId}`)
      toast.success('Installment deleted & Finance updated!')
      fetchData()
    } catch {}
  }

  const handleAddFollowUp = async (e) => {
    e.preventDefault()
    if (!fuForm.note) return toast.error('Note required')
    setSaving(true)
    try {
      await addFollowUp(id, fuForm)
      toast.success('Follow-up added!')
      setShowFollowUp(false)
      setFuForm({ note: '', status: 'callback', date: '' })
      fetchData()
    } catch {}
    setSaving(false)
  }

  const handleSaveBroker = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/students/${id}/broker`, brokerForm)
      toast.success('Broker details saved!')
      setShowBroker(false)
      fetchData()
    } catch {}
    setSaving(false)
  }

  const openEditInstallment = (inst) => {
    setEditInstallment(inst)
    setInstForm({
      amount: inst.amount,
      mode: inst.mode || 'upi',
      note: inst.note || '',
      date: inst.date ? new Date(inst.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      referenceNumber: inst.referenceNumber || ''
    })
    setShowInstallment(true)
  }

  if (loading) return <Spinner />
  if (!student) return null

  const actualFee = student.courseFeeDecided || student.totalFee || 0
  const feePercent = actualFee ? Math.min(100, Math.round(((student.totalReceived || 0) / actualFee) * 100)) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/queries')} className="btn-ghost">← Back</button>
          <div>
            <h1 className="page-title">{student.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`badge ${studentStatusColor[student.status]} capitalize`}>{student.status}</span>
              <span className={`badge ${conversionColor[student.conversionExpectation]} capitalize`}>{student.conversionExpectation?.replace('_', ' ')}</span>
              {student.batchName && <span className="badge badge-purple">{student.batchName}</span>}
              {student.fromPublicForm && <span className="badge badge-blue">Web Form</span>}
            </div>
          </div>
        </div>
        {can('queries', 'edit') && (
          <button onClick={() => setShowEdit(true)} className="btn-primary">✏️ Edit Profile</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — Profile */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5">
            <h3 className="section-title mb-4">Profile</h3>
            <div className="space-y-2.5">
              {[
                ['📱 Contact', student.contact],
                ['📧 Email', student.email || '—'],
                ['🏙️ City', student.city || '—'],
                ['👤 Gender', student.gender || '—'],
                ['🔗 Referred By', student.referredBy || 'Self'],
                ['🎓 Profile', `${student.profileType} — ${student.studentDetail || student.professionalDetail || '—'}`],
                ['📊 Trader Level', student.traderKnowledge?.replace(/_/g, ' ')],
                ['📞 How Reached', student.howReached?.replace(/_/g, ' ')],
                ['📅 Visit/Call', student.visitCallDateTime ? fmtDateTime(student.visitCallDateTime) : '—'],
                ['📅 Added', fmtDate(student.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm gap-2">
                  <span className="text-slate-500 dark:text-slate-400 flex-shrink-0">{label}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{value}</span>
                </div>
              ))}
            </div>

            {/* Dynamic fields from public form */}
            {student.dynamicFields && Object.keys(student.dynamicFields).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Additional Info</div>
                {Object.entries(student.dynamicFields).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm gap-2 mb-2">
                    <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{value || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fee Summary */}
          <div className="card p-5">
            <h3 className="section-title mb-3">Fee Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Fee Told</span><span>{student.feeTold ? fmtCurrency(student.feeTold) : '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="text-orange-500">{student.discountTold ? `- ${fmtCurrency(student.discountTold)}` : '—'}</span></div>
              <div className="flex justify-between font-semibold border-t border-slate-100 dark:border-slate-700 pt-2">
                <span className="text-slate-700 dark:text-slate-300">Course Fee (Final)</span>
                <span className="text-primary-600">{actualFee ? fmtCurrency(actualFee) : '—'}</span>
              </div>
              <div className="flex justify-between"><span className="text-slate-500">Received</span><span className="font-bold text-green-600">{fmtCurrency(student.totalReceived)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Pending</span><span className={`font-bold ${(student.feePending || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmtCurrency(student.feePending || 0)}</span></div>
              {actualFee > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Collected</span><span>{feePercent}%</span></div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${feePercent === 100 ? 'bg-green-500' : 'bg-primary-600'}`} style={{ width: `${feePercent}%` }} />
                  </div>
                </div>
              )}
              {student.feeRemarks && (
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Fee Remarks:</div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-300 mt-0.5">{student.feeRemarks}</div>
                </div>
              )}
            </div>
          </div>

          {/* Broker Account */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title">Broker Account</h3>
              {can('queries', 'edit') && (
                <button onClick={() => setShowBroker(true)} className="btn-ghost text-xs px-2 py-1">✏️ Edit</button>
              )}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${student.brokerAccountOpened ? 'bg-green-500' : 'bg-slate-300'}`} />
              <span className="text-sm font-medium">{student.brokerAccountOpened ? 'Account Opened' : 'Not Opened'}</span>
            </div>
            {student.brokerAccountOpened && student.brokerDetails && (
              <div className="space-y-1.5 text-sm">
                {student.brokerDetails.brokerName && <div className="flex justify-between"><span className="text-slate-500">Broker</span><span className="font-medium">{student.brokerDetails.brokerName}</span></div>}
                {student.brokerDetails.accountNumber && <div className="flex justify-between"><span className="text-slate-500">Account</span><span className="font-mono text-xs">{student.brokerDetails.accountNumber}</span></div>}
                {student.brokerDetails.clientCode && <div className="flex justify-between"><span className="text-slate-500">Client Code</span><span className="font-mono text-xs">{student.brokerDetails.clientCode}</span></div>}
                {student.brokerDetails.linkedMobile && <div className="flex justify-between"><span className="text-slate-500">Mobile</span><span>{student.brokerDetails.linkedMobile}</span></div>}
              </div>
            )}
          </div>
        </div>

        {/* Right — Activity */}
        <div className="lg:col-span-2 space-y-4">
          {student.remarks && (
            <div className="card p-4">
              <h3 className="section-title mb-2">Remarks</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{student.remarks}</p>
            </div>
          )}

          {/* Installments — available for ALL statuses */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Fee Installments</h3>
              {can('queries', 'edit') && (
                <button onClick={() => { setEditInstallment(null); setInstForm({ amount: '', mode: 'upi', note: '', date: new Date().toISOString().slice(0, 10), referenceNumber: '' }); setShowInstallment(true) }}
                  className="btn-primary text-xs px-3 py-1.5">+ Add Installment</button>
              )}
            </div>
            {(!student.installments || student.installments.length === 0) ? (
              <p className="text-sm text-slate-400 text-center py-4">No installments recorded yet</p>
            ) : (
              <div className="space-y-2">
                {student.installments.map((inst, i) => (
                  <div key={inst._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {inst.number || i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-green-600">{fmtCurrency(inst.amount)}</div>
                        <div className="text-xs text-slate-500">
                          {inst.mode?.toUpperCase()} · {fmtDate(inst.date || inst.createdAt)}
                          {inst.note && ` · ${inst.note}`}
                          {inst.referenceNumber && ` · Ref: ${inst.referenceNumber}`}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {student.name} · {student.batchName || 'No Batch'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {can('queries', 'edit') && (
                        <button onClick={() => openEditInstallment(inst)}
                          className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-500 text-sm">✏️</button>
                      )}
                      {can('queries', 'delete') && (
                        <button onClick={() => setDeleteInstId(inst._id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500 text-sm">🗑️</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-ups */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Follow-Up History</h3>
              {can('queries', 'edit') && (
                <button onClick={() => setShowFollowUp(true)} className="btn-primary text-xs px-3 py-1.5">+ Add Follow-up</button>
              )}
            </div>
            {(!student.followUps || student.followUps.length === 0) ? (
              <p className="text-sm text-slate-400 text-center py-4">No follow-ups recorded yet</p>
            ) : (
              <div className="space-y-3">
                {student.followUps.map((fu, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{fu.number || i + 1}</div>
                      {i < student.followUps.length - 1 && <div className="w-0.5 bg-slate-200 dark:bg-slate-700 flex-1 mt-1" />}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{fu.note}</span>
                        <span className={`badge text-xs ${fu.status === 'converted' ? 'badge-green' : fu.status === 'lost' ? 'badge-red' : 'badge-yellow'} capitalize`}>{fu.status?.replace('_', ' ')}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{fu.date ? fmtDate(fu.date) : fmtDate(fu.createdAt)} · {fu.doneBy?.name || 'Team'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Student Profile" size="lg">
        <StudentForm student={student} onSuccess={() => { setShowEdit(false); fetchData() }} />
      </Modal>

      {/* Installment Modal */}
      <Modal open={showInstallment} onClose={() => { setShowInstallment(false); setEditInstallment(null) }}
        title={editInstallment ? 'Edit Installment' : 'Add Installment'} size="sm">
        <form onSubmit={handleAddInstallment} className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-400">
            💡 {editInstallment ? 'Updating will sync to Finance automatically' : 'Adding will auto-record in Finance → Education Business'}
          </div>
          <FormField label="Amount (₹)" required>
            <input className="input" type="number" value={instForm.amount} onChange={e => setInstForm(f => ({ ...f, amount: e.target.value }))} placeholder="Enter amount" />
          </FormField>
          <FormField label="Date">
            <input className="input" type="date" value={instForm.date} onChange={e => setInstForm(f => ({ ...f, date: e.target.value }))} />
          </FormField>
          <FormField label="Payment Mode">
            <select className="input" value={instForm.mode} onChange={e => setInstForm(f => ({ ...f, mode: e.target.value }))}>
              {[['cash','Cash'],['upi','UPI'],['gpay','GPay'],['phonepe','PhonePe'],['bank_transfer','Bank Transfer'],['cheque','Cheque'],['card','Card']].map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Reference / UTR Number">
            <input className="input" value={instForm.referenceNumber} onChange={e => setInstForm(f => ({ ...f, referenceNumber: e.target.value }))} placeholder="Optional reference" />
          </FormField>
          <FormField label="Note">
            <input className="input" value={instForm.note} onChange={e => setInstForm(f => ({ ...f, note: e.target.value }))} placeholder="Optional note" />
          </FormField>
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
            {saving ? '⏳ Saving...' : editInstallment ? '✅ Update Installment' : '✅ Add Installment'}
          </button>
        </form>
      </Modal>

      {/* Follow-up Modal */}
      <Modal open={showFollowUp} onClose={() => setShowFollowUp(false)} title="Add Follow-Up" size="sm">
        <form onSubmit={handleAddFollowUp} className="space-y-4">
          <FormField label="Follow-up Note" required>
            <textarea className="input h-24 resize-none" value={fuForm.note} onChange={e => setFuForm(f => ({ ...f, note: e.target.value }))} placeholder="What happened in this follow-up..." />
          </FormField>
          <FormField label="Date">
            <input className="input" type="date" value={fuForm.date} onChange={e => setFuForm(f => ({ ...f, date: e.target.value }))} />
          </FormField>
          <FormField label="Status After Follow-up">
            <select className="input" value={fuForm.status} onChange={e => setFuForm(f => ({ ...f, status: e.target.value }))}>
              {followUpStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </FormField>
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center">{saving ? '⏳ Saving...' : '✅ Add Follow-up'}</button>
        </form>
      </Modal>

      {/* Broker Modal */}
      <Modal open={showBroker} onClose={() => setShowBroker(false)} title="Broker Account Details" size="sm">
        <form onSubmit={handleSaveBroker} className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <input type="checkbox" id="brokerOpened" checked={brokerForm.brokerAccountOpened}
              onChange={e => setBrokerForm(f => ({ ...f, brokerAccountOpened: e.target.checked }))}
              className="w-4 h-4 accent-primary-600" />
            <label htmlFor="brokerOpened" className="text-sm font-medium cursor-pointer text-slate-700 dark:text-slate-300">Broker Account Opened</label>
          </div>
          {brokerForm.brokerAccountOpened && (
            <>
              <FormField label="Broker Name">
                <input className="input" value={brokerForm.brokerDetails.brokerName || ''} onChange={e => setBrokerForm(f => ({ ...f, brokerDetails: { ...f.brokerDetails, brokerName: e.target.value } }))} placeholder="e.g. Zerodha, Upstox, Angel One" />
              </FormField>
              <FormField label="Account Number">
                <input className="input font-mono" value={brokerForm.brokerDetails.accountNumber || ''} onChange={e => setBrokerForm(f => ({ ...f, brokerDetails: { ...f.brokerDetails, accountNumber: e.target.value } }))} placeholder="Trading account number" />
              </FormField>
              <FormField label="Client Code">
                <input className="input font-mono" value={brokerForm.brokerDetails.clientCode || ''} onChange={e => setBrokerForm(f => ({ ...f, brokerDetails: { ...f.brokerDetails, clientCode: e.target.value } }))} placeholder="Client/UCC code" />
              </FormField>
              <FormField label="Linked Mobile">
                <input className="input" value={brokerForm.brokerDetails.linkedMobile || ''} onChange={e => setBrokerForm(f => ({ ...f, brokerDetails: { ...f.brokerDetails, linkedMobile: e.target.value } }))} placeholder="Mobile linked with broker" />
              </FormField>
              <FormField label="Notes">
                <textarea className="input h-16 resize-none" value={brokerForm.brokerDetails.notes || ''} onChange={e => setBrokerForm(f => ({ ...f, brokerDetails: { ...f.brokerDetails, notes: e.target.value } }))} placeholder="Any notes..." />
              </FormField>
            </>
          )}
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center">{saving ? '⏳ Saving...' : '✅ Save Broker Details'}</button>
        </form>
      </Modal>

      {/* Delete installment confirm */}
      <Confirm open={!!deleteInstId} onClose={() => setDeleteInstId(null)}
        onConfirm={() => { handleDeleteInstallment(deleteInstId); setDeleteInstId(null) }}
        title="Delete Installment" message="This will delete the installment and remove the entry from Finance as well." danger />
    </div>
  )
}
