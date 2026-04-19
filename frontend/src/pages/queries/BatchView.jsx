import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { Spinner, Empty, Modal, FormField } from '../../components/common'
import { fmtCurrency, fmtDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function BatchView() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [editRemarks, setEditRemarks] = useState(null)
  const [remarksText, setRemarksText] = useState('')
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/students/batch-summary')
      setBatches(res.data.data)
    } catch {}
    setLoading(false)
  }

  const toggleExpand = (batchName) => {
    setExpanded(e => ({ ...e, [batchName]: !e[batchName] }))
  }

  const saveRemarks = async () => {
    try {
      await api.put(`/students/${editRemarks.id}`, { feeRemarks: remarksText })
      toast.success('Remarks saved!')
      setEditRemarks(null)
      fetchData()
    } catch {}
  }

  if (loading) return <Spinner />

  if (batches.length === 0) return (
    <Empty icon="🎓" title="No batch data" desc="Convert students and assign batches to see batch-wise summary" />
  )

  return (
    <div className="space-y-4">
      {batches.map(batch => {
        const batchName = batch._id || 'No Batch Assigned'
        const isExpanded = expanded[batchName]
        const feePercent = batch.totalFee ? Math.round((batch.totalReceived / batch.totalFee) * 100) : 0

        return (
          <div key={batchName} className="card overflow-hidden">
            {/* Batch Header */}
            <div className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              onClick={() => toggleExpand(batchName)}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 font-bold text-sm">
                    {isExpanded ? '▼' : '▶'}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{batchName}</div>
                    <div className="text-xs text-slate-400">{batch.totalStudents} student{batch.totalStudents !== 1 ? 's' : ''}</div>
                  </div>
                </div>

                {/* Batch Financial Summary */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-center">
                    <div className="text-xs text-slate-400">Total Fee</div>
                    <div className="font-bold text-slate-800 dark:text-white text-sm">{fmtCurrency(batch.totalFee || 0)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-400">Received</div>
                    <div className="font-bold text-green-600 text-sm">{fmtCurrency(batch.totalReceived || 0)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-400">Pending</div>
                    <div className={`font-bold text-sm ${(batch.totalPending || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmtCurrency(batch.totalPending || 0)}</div>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <div className="text-xs text-slate-400 mb-1">Collection</div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                      <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${feePercent}%` }} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{feePercent}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student List (Expandable) */}
            {isExpanded && (
              <div className="border-t border-slate-100 dark:border-slate-700">
                <div className="table-container rounded-none border-0">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Total Fee</th>
                        <th>Received</th>
                        <th>Pending</th>
                        <th>Broker</th>
                        <th>Fee Remarks</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batch.students.map((s, i) => (
                        <tr key={s._id}>
                          <td className="text-slate-400 text-xs">{i + 1}</td>
                          <td>
                            <button onClick={() => navigate(`/queries/${s._id}`)}
                              className="font-medium text-primary-600 hover:underline text-left">
                              {s.name}
                            </button>
                          </td>
                          <td className="font-mono text-xs">{s.contact}</td>
                          <td className="font-medium">{fmtCurrency(s.totalFee || 0)}</td>
                          <td className="font-medium text-green-600">{fmtCurrency(s.totalReceived || 0)}</td>
                          <td>
                            <span className={`font-bold text-sm ${(s.feePending || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {fmtCurrency(s.feePending || 0)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${s.brokerAccountOpened ? 'badge-green' : 'badge-gray'} text-xs`}>
                              {s.brokerAccountOpened ? '✓ Yes' : 'No'}
                            </span>
                          </td>
                          <td>
                            {s.feeRemarks ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500 max-w-[120px] truncate" title={s.feeRemarks}>{s.feeRemarks}</span>
                                <button onClick={() => { setEditRemarks({ id: s._id, name: s.name }); setRemarksText(s.feeRemarks || '') }}
                                  className="text-xs text-blue-500 hover:underline flex-shrink-0">edit</button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditRemarks({ id: s._id, name: s.name }); setRemarksText('') }}
                                className="text-xs text-slate-400 hover:text-primary-600 hover:underline">+ Add</button>
                            )}
                          </td>
                          <td>
                            <button onClick={() => navigate(`/queries/${s._id}`)} className="btn-ghost text-xs px-2 py-1">View →</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Remarks Modal */}
      <Modal open={!!editRemarks} onClose={() => setEditRemarks(null)} title={`Fee Remarks — ${editRemarks?.name}`} size="sm">
        <div className="space-y-4">
          <FormField label="Fee Remarks">
            <textarea className="input h-24 resize-none" value={remarksText} onChange={e => setRemarksText(e.target.value)}
              placeholder="e.g. Pending 2nd installment, promised by 15th..." />
          </FormField>
          <button onClick={saveRemarks} className="btn-primary w-full justify-center">✅ Save Remarks</button>
        </div>
      </Modal>
    </div>
  )
}
