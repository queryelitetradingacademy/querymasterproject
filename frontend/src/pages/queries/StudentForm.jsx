import { useState, useEffect } from 'react'
import { createStudent, updateStudent } from '../../api/students'
import { getSettings } from '../../api/admin'
import { FormField, Select } from '../../components/common'
import toast from 'react-hot-toast'

const DEFAULTS = {
  name: '', contact: '', email: '', city: '', gender: '',
  referredBy: 'self', profileType: 'student', studentDetail: '', professionalDetail: '',
  traderKnowledge: 'beginner', feeTold: '', discountTold: '', registrationDone: false,
  registrationAmount: '', conversionExpectation: 'good', howReached: 'phone',
  howReachedOther: '', visitCallDateTime: '', source: '', remarks: '',
  converted: false, batchName: '', courseType: 'live_batch', totalFee: ''
}

export default function StudentForm({ student, onSuccess }) {
  const [form, setForm] = useState(student ? { ...DEFAULTS, ...student } : DEFAULTS)
  const [loading, setLoading] = useState(false)
  const [batches, setBatches] = useState([])
  const [sources, setSources] = useState([])

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await getSettings({ category: 'queries' })
      const settings = res.data.data
      const batchSetting = settings.find(s => s.key === 'batches')
      const sourceSetting = settings.find(s => s.key === 'query_sources')
      if (batchSetting) setBatches(batchSetting.values.filter(v => v.isActive))
      if (sourceSetting) setSources(sourceSetting.values.filter(v => v.isActive))
    } catch {}
  }

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.contact) return toast.error('Name and contact are required')
    setLoading(true)
    try {
      if (student) await updateStudent(student._id, form)
      else await createStudent(form)
      toast.success(student ? 'Query updated!' : 'Query created!')
      onSuccess()
    } catch {}
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">Basic Information</h3>
        <div className="form-grid">
          <FormField label="Full Name" required>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Student full name" />
          </FormField>
          <FormField label="Contact / WhatsApp" required>
            <input className="input" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="10-digit mobile number" />
          </FormField>
          <FormField label="Email">
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email address" />
          </FormField>
          <FormField label="City">
            <input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
          </FormField>
          <FormField label="Gender">
            <Select value={form.gender} onChange={e => set('gender', e.target.value)}
              options={[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }, { label: 'Other', value: 'other' }]}
              placeholder="Select gender" />
          </FormField>
          <FormField label="Referred By">
            <input className="input" value={form.referredBy} onChange={e => set('referredBy', e.target.value)} placeholder="Name or 'self'" />
          </FormField>
        </div>
      </div>

      {/* Profile */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">Profile Details</h3>
        <div className="form-grid">
          <FormField label="Profile Type">
            <Select value={form.profileType} onChange={e => set('profileType', e.target.value)}
              options={[{ label: 'Student', value: 'student' }, { label: 'Professional', value: 'professional' }]} />
          </FormField>
          {form.profileType === 'student' ? (
            <FormField label="Student Detail">
              <input className="input" value={form.studentDetail} onChange={e => set('studentDetail', e.target.value)} placeholder="e.g. Class 12, Graduation" />
            </FormField>
          ) : (
            <FormField label="Profession">
              <input className="input" value={form.professionalDetail} onChange={e => set('professionalDetail', e.target.value)} placeholder="e.g. Software Engineer, Doctor" />
            </FormField>
          )}
          <FormField label="Trader Knowledge Level">
            <Select value={form.traderKnowledge} onChange={e => set('traderKnowledge', e.target.value)}
              options={[
                { label: 'Beginner', value: 'beginner' },
                { label: 'Basic Knowledge', value: 'basic_knowledge' },
                { label: 'Loss Making', value: 'loss_making' }
              ]} />
          </FormField>
          <FormField label="Conversion Expectation">
            <Select value={form.conversionExpectation} onChange={e => set('conversionExpectation', e.target.value)}
              options={[
                { label: '🔴 Poor', value: 'poor' },
                { label: '🟡 Good', value: 'good' },
                { label: '🟢 Very Good ⭐', value: 'very_good' }
              ]} />
          </FormField>
        </div>
      </div>

      {/* Query Details */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">Query Details</h3>
        <div className="form-grid">
          <FormField label="Fee Told (₹)">
            <input className="input" type="number" value={form.feeTold} onChange={e => set('feeTold', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Discount Told (₹)">
            <input className="input" type="number" value={form.discountTold} onChange={e => set('discountTold', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Registration Done?">
            <Select value={form.registrationDone ? 'yes' : 'no'} onChange={e => set('registrationDone', e.target.value === 'yes')}
              options={[{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }]} />
          </FormField>
          {form.registrationDone && (
            <FormField label="Registration Amount (₹)">
              <input className="input" type="number" value={form.registrationAmount} onChange={e => set('registrationAmount', e.target.value)} placeholder="0" />
            </FormField>
          )}
          <FormField label="How Reached">
            <Select value={form.howReached} onChange={e => set('howReached', e.target.value)}
              options={[
                { label: 'Phone Call', value: 'phone' },
                { label: 'Office Visit', value: 'office_visit' },
                { label: 'Website Registration', value: 'website_registration' },
                { label: 'Meta Ad', value: 'meta_ad' },
                { label: 'Instagram', value: 'instagram' },
                { label: 'WhatsApp', value: 'whatsapp' },
                { label: 'Referral', value: 'referral' },
                { label: 'Other', value: 'other' }
              ]} />
          </FormField>
          {(form.howReached === 'phone' || form.howReached === 'office_visit') && (
            <FormField label="Visit / Call Date & Time">
              <input className="input" type="datetime-local" value={form.visitCallDateTime ? new Date(form.visitCallDateTime).toISOString().slice(0, 16) : ''}
                onChange={e => set('visitCallDateTime', e.target.value)} />
            </FormField>
          )}
          {form.howReached === 'other' && (
            <FormField label="Specify Source">
              <input className="input" value={form.howReachedOther} onChange={e => set('howReachedOther', e.target.value)} placeholder="Specify how they reached" />
            </FormField>
          )}
          <FormField label="Source Channel">
            <Select value={form.source} onChange={e => set('source', e.target.value)}
              options={sources.map(s => ({ label: s.label, value: s.value }))}
              placeholder="Select source" />
          </FormField>
          <FormField label="Batch / Course">
            <Select value={form.batchName} onChange={e => set('batchName', e.target.value)}
              options={batches.map(b => ({ label: b.label, value: b.value }))}
              placeholder="Select batch" />
          </FormField>
        </div>
      </div>

      {/* Conversion + Fee */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">Conversion</h3>
        <div className="form-grid">
          <FormField label="Converted?">
            <Select value={form.converted ? 'yes' : 'no'} onChange={e => set('converted', e.target.value === 'yes')}
              options={[{ label: 'No — Move to Pending', value: 'no' }, { label: 'Yes — Move to Confirmed ✅', value: 'yes' }]} />
          </FormField>
          {form.converted && (
            <FormField label="Total Course Fee (₹)">
              <input className="input" type="number" value={form.totalFee} onChange={e => set('totalFee', e.target.value)} placeholder="Total fee amount" />
            </FormField>
          )}
        </div>
      </div>

      {/* Remarks */}
      <FormField label="Remarks">
        <textarea className="input h-24 resize-none" value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Any additional notes..." />
      </FormField>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-2.5">
          {loading ? '⏳ Saving...' : student ? '✅ Update Query' : '➕ Create Query'}
        </button>
      </div>
    </form>
  )
}
