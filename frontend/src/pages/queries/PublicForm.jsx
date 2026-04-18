import { useState, useEffect } from 'react'
import { publicFormSubmit } from '../../api/students'
import { getPublicFields } from '../../api/formfields'
import toast from 'react-hot-toast'

export default function PublicForm() {
  const [fields, setFields] = useState([])
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [done, setDone] = useState(false)

  useEffect(() => { loadFields() }, [])

  const loadFields = async () => {
    try {
      const res = await getPublicFields()
      setFields(res.data.data)
      // init form state
      const init = {}
      res.data.data.forEach(f => { init[f.fieldName] = '' })
      setForm(init)
    } catch {
      // fallback default fields
      setFields([
        { fieldName: 'name', label: 'Full Name', fieldType: 'text', isRequired: true, placeholder: 'Your full name' },
        { fieldName: 'contact', label: 'Mobile / WhatsApp', fieldType: 'tel', isRequired: true, placeholder: '10-digit number' },
        { fieldName: 'email', label: 'Email', fieldType: 'email', isRequired: false, placeholder: 'your@email.com' },
        { fieldName: 'city', label: 'City', fieldType: 'text', isRequired: false, placeholder: 'Your city' },
        { fieldName: 'remarks', label: 'Message', fieldType: 'textarea', isRequired: false, placeholder: 'Your query...' },
      ])
    }
    setFetching(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Validate required fields
    for (const field of fields) {
      if (field.isRequired && !form[field.fieldName]) {
        return toast.error(`${field.label} is required`)
      }
    }
    setLoading(true)
    try {
      await publicFormSubmit({ ...form, howReached: 'website_registration' })
      setDone(true)
    } catch { toast.error('Submission failed. Please try again.') }
    setLoading(false)
  }

  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-slate-100 dark:from-dark-950 dark:to-dark-900 flex items-center justify-center p-4">
      <div className="card p-10 max-w-md w-full text-center shadow-xl">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Query Submitted!</h2>
        <p className="text-slate-500 dark:text-slate-400">Thank you! Our team will contact you within 24 hours.</p>
        <button onClick={() => { setDone(false); setForm({}) }} className="btn-secondary mt-6 mx-auto">Submit Another</button>
      </div>
    </div>
  )

  if (fetching) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-slate-100 dark:from-dark-950 dark:to-dark-900 flex items-center justify-center p-4">
      <div className="card p-8 max-w-lg w-full shadow-xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">Q</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Enquiry Form</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Fill in your details and we'll get back to you</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.fieldName}>
              <label className="label">
                {field.label}
                {field.isRequired && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {field.fieldType === 'textarea' ? (
                <textarea className="input h-24 resize-none"
                  value={form[field.fieldName] || ''}
                  onChange={e => set(field.fieldName, e.target.value)}
                  placeholder={field.placeholder} />
              ) : field.fieldType === 'select' ? (
                <select className="input" value={form[field.fieldName] || ''} onChange={e => set(field.fieldName, e.target.value)}>
                  <option value="">Select {field.label}</option>
                  {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input className="input"
                  type={field.fieldType}
                  value={form[field.fieldName] || ''}
                  onChange={e => set(field.fieldName, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.isRequired} />
              )}
            </div>
          ))}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
            {loading ? '⏳ Submitting...' : '🚀 Submit Enquiry'}
          </button>
        </form>
      </div>
    </div>
  )
}
