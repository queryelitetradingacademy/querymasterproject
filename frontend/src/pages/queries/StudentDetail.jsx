import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStudent, addInstallment, addFollowUp, updateStudent } from '../../api/students'
import { Spinner, Modal, Badge, FormField } from '../../components/common'
import { fmtDate, fmtDateTime, fmtCurrency, conversionColor, studentStatusColor } from '../../utils/helpers'
import toast from 'react-hot-toast'
import StudentForm from './StudentForm'
import useAuthStore from '../../store/authStore'

const followUpStatuses = [
  { label: 'Interested', value: 'interested' },
  { label: 'Not Interested', value: 'not_interested' },
  { label: 'Callback', value: 'callback' },
  { label: 'No Response', value: 'no_response' },
  { label: 'Converted', value: 'converted' },
  { label: 'Lost', value: 'lost' },
]

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = useAuthStore()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showInstallment, setShowInstallment] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [instForm, setInstForm] = useState({ amount: '', mode: 'upi', note: '' })
  const [fuForm, setFuForm] = useState({ note: '', status: 'callback', date: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getStudent(id)
      setStudent(res.data.data)
    } catch { navigate('/queries') }
    setLoading(false)
  }

  const handleAddInstallment = async (e) => {
    e.preventDefault()
    if (!instForm.amount) return toast.error('Amount required')
    setSaving(true)
    try {
      await addInstallment(id, instForm)
      toast.success('Installment added!')
      setShowInstallment(false)
      setInstForm({ amount: '', mode: 'upi', note: '' })
      fetchData()
    } catch {}
    setSaving(false)
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

  if (loading) return <Spinner />
  if (!student) return null

  const feePercent = student.totalFee ? Math.round((student.totalReceived / student.totalFee) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/queries')} className="btn-ghost">← Back</button>
          <div>
            <h1 className="page-title">{student.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`badge ${studentStatusColor[student.status]} capitalize`}>{student.status}</span>
              <span className={`badge ${conversionColor[student.conversionExpectation]} capitalize`}>{student.conversionExpectation?.replace('_', ' ')}</span>
              {student.fromPublicForm && <span className="badge badge-purple">Web Form</span>}
            </div>
          </div>
        </div>
        {can('queries', 'edit') && (
          <button onClick={() => setShowEdit(true)} className="btn-primary">✏️ Edit</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — Profile */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5">
            <h3 className="section-title mb-4">Profile</h3>
            <div className="space-y-3">
              {[
                ['📱 Contact', student.contact],
                ['📧 Email', student.email || '—'],
                ['🏙️ City', student.city || '—'],
                ['👤 Gender', student.gender || '—'],
                ['🔗 Referred By', student.referredBy || 'Self'],
                ['🎓 Profile', `${student.profileType} ${student.studentDetail || student.professionalDetail || ''}`],
                ['📊 Trader Level', student.traderKnowledge?.replace('_', ' ')],
                ['📞 How Reached', student.howReached?.replace('_', ' ')],
                ['📅 Visit/Call', student.visitCallDateTime ? fmtDateTime(student.visitCallDateTime) : '—'],
                ['📅 Added On', fmtDate(student.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{label}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fee Summary */}
          <div className="card p-5">
            <h3 className="section-title mb-3">Fee Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Fee Told</span><span className="font-medium">{student.feeTold ? fmtCurrency(student.feeTold) : '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-medium text-orange-600">{student.discountTold ? `- ${fmtCurrency(student.discountTold)}` : '—'}</span></div>
              {student.converted && <>
                <div className="border-t border-slate-100 dark:border-slate-700 pt-2 mt-2">
                  <div className="flex justify-between"><span className="text-slate-500">Total Fee</span><span className="font-bold">{fmtCurrency(student.totalFee)}</span></div>
                  <div className="flex justify-between mt-1"><span className="text-slate-500">Received</span><span className="font-bold text-green-600">{fmtCurrency(student.totalReceived)}</span></div>
                  <div className="flex justify-between mt-1"><span className="text-slate-500">Pending</span><span className={`font-bold ${student.feePending > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmtCurrency(student.feePending)}</span></div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Fee collected</span><span className="font-medium">{feePercent}%</span></div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${feePercent}%` }} />
                  </div>
                </div>
              </>}
            </div>
          </div>
        </div>

        {/* Right — Activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* Remarks */}
          {student.remarks && (
            <div className="card p-4">
              <h3 className="section-title mb-2">Remarks</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{student.remarks}</p>
            </div>
          )}

          {/* Installments (Confirmed) */}
          {student.converted && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Fee Installments</h3>
                {can('queries', 'edit') && student.feePending > 0 && (
                  <button onClick={() => setShowInstallment(true)} className="btn-primary text-xs px-3 py-1.5">+ Add Installment</button>
                )}
              </div>
              {student.installments?.length === 0 ? (
                <p className="text-sm text-slate-400">No installments recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {student.installments.map((inst, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Installment {inst.number || i + 1}</span>
                        <div className="text-sm font-bold text-green-600">{fmtCurrency(inst.amount)}</div>
                        {inst.note && <div className="text-xs text-slate-400">{inst.note}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-xs badge badge-green">{inst.mode?.toUpperCase()}</div>
                        <div className="text-xs text-slate-400 mt-1">{fmtDate(inst.date || inst.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Follow-ups (Pending / Lead) */}
          {!student.converted && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Follow-Up History</h3>
                {can('queries', 'edit') && (
                  <button onClick={() => setShowFollowUp(true)} className="btn-primary text-xs px-3 py-1.5">+ Add Follow-up</button>
                )}
              </div>
              {student.followUps?.length === 0 ? (
                <p className="text-sm text-slate-400">No follow-ups recorded yet</p>
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
                        <div className="text-xs text-slate-400 mt-1">{fu.date ? fmtDate(fu.date) : fmtDate(fu.createdAt)} · by {fu.doneBy?.name || 'Team'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Query" size="lg">
        <StudentForm student={student} onSuccess={() => { setShowEdit(false); fetchData() }} />
      </Modal>

      {/* Installment Modal */}
      <Modal open={showInstallment} onClose={() => setShowInstallment(false)} title="Add Installment" size="sm">
        <form onSubmit={handleAddInstallment} className="space-y-4">
          <FormField label="Amount (₹)" required>
            <input className="input" type="number" value={instForm.amount} onChange={e => setInstForm(f => ({ ...f, amount: e.target.value }))} placeholder="Enter amount" />
          </FormField>
          <FormField label="Payment Mode">
            <select className="input" value={instForm.mode} onChange={e => setInstForm(f => ({ ...f, mode: e.target.value }))}>
              {['cash','upi','gpay','phonepe','bank_transfer','cheque','card'].map(m => <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>)}
            </select>
          </FormField>
          <FormField label="Note">
            <input className="input" value={instForm.note} onChange={e => setInstForm(f => ({ ...f, note: e.target.value }))} placeholder="Optional note" />
          </FormField>
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center">{saving ? '⏳ Saving...' : '✅ Add Installment'}</button>
        </form>
      </Modal>

      {/* Follow-up Modal */}
      <Modal open={showFollowUp} onClose={() => setShowFollowUp(false)} title="Add Follow-Up" size="sm">
        <form onSubmit={handleAddFollowUp} className="space-y-4">
          <FormField label="Follow-up Note" required>
            <textarea className="input h-24 resize-none" value={fuForm.note} onChange={e => setFuForm(f => ({ ...f, note: e.target.value }))} placeholder="What happened in this follow-up..." />
          </FormField>
          <FormField label="Follow-up Date">
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
    </div>
  )
}
