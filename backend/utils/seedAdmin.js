const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const FormField = require('../models/FormField');

const defaultSettings = [
  // Queries
  { key: 'query_sources', label: 'Query Sources', category: 'queries', type: 'dropdown_options', values: [
    { label: 'Meta Ad', value: 'meta_ad' }, { label: 'Instagram', value: 'instagram' },
    { label: 'WhatsApp', value: 'whatsapp' }, { label: 'Referral', value: 'referral' },
    { label: 'Walk-in', value: 'walk_in' }, { label: 'YouTube', value: 'youtube' },
    { label: 'Website', value: 'website' }, { label: 'Phone', value: 'phone' }
  ]},
  { key: 'batches', label: 'Batches / Courses', category: 'queries', type: 'dropdown_options', values: [
    { label: 'Batch A - Morning', value: 'batch_a' }, { label: 'Batch B - Evening', value: 'batch_b' },
    { label: 'Recorded Course', value: 'recorded' }, { label: 'Strategy Course', value: 'strategy' }
  ]},
  // Tasks
  { key: 'task_categories', label: 'Task Categories', category: 'tasks', type: 'dropdown_options', values: [
    { label: 'Trading / Market', value: 'trading' }, { label: 'Student / Education', value: 'education' },
    { label: 'Personal', value: 'personal' }, { label: 'Business Operations', value: 'business' },
    { label: 'Follow-up', value: 'followup' }, { label: 'Finance', value: 'finance' }
  ]},
  // Finance
  { key: 'income_sources', label: 'Income Sources', category: 'finance', type: 'dropdown_options', values: [
    { label: 'Course Fees', value: 'course_fees' }, { label: 'Trading Profit', value: 'trading_profit' },
    { label: 'Brokerage Income', value: 'brokerage' }, { label: 'Strategy Selling', value: 'strategy_selling' },
    { label: 'USDT Selling', value: 'usdt_selling' }, { label: 'Dividend', value: 'dividend' },
    { label: 'Referral Commission', value: 'referral' }, { label: 'Other', value: 'other' }
  ]},
  { key: 'expense_categories', label: 'Expense Categories', category: 'finance', type: 'dropdown_options', values: [
    { label: 'Office Rent', value: 'office_rent' }, { label: 'Marketing / Ads', value: 'marketing' },
    { label: 'Software / Tools', value: 'software' }, { label: 'Trading Fees / Brokerage', value: 'trading_fees' },
    { label: 'Staff Salary', value: 'salary' }, { label: 'Utilities', value: 'utilities' },
    { label: 'Travel', value: 'travel' }, { label: 'Food', value: 'food' },
    { label: 'Personal Expense', value: 'personal' }, { label: 'Tax / GST', value: 'tax' },
    { label: 'LIC / Insurance', value: 'insurance' }, { label: 'Other', value: 'other' }
  ]},
  { key: 'payment_modes', label: 'Payment Modes', category: 'finance', type: 'dropdown_options', values: [
    { label: 'Cash', value: 'cash' }, { label: 'GPay', value: 'gpay' },
    { label: 'PhonePe', value: 'phonepe' }, { label: 'Paytm', value: 'paytm' },
    { label: 'Bank Transfer / NEFT', value: 'bank_transfer' }, { label: 'Razorpay', value: 'razorpay' },
    { label: 'Cheque', value: 'cheque' }, { label: 'Credit Card', value: 'card' },
    { label: 'USDT / Crypto', value: 'usdt' }
  ]},
  { key: 'bank_accounts', label: 'Bank Accounts', category: 'finance', type: 'dropdown_options', values: [
    { label: 'SBI - Primary', value: 'sbi_primary' }, { label: 'HDFC - Business', value: 'hdfc_business' },
    { label: 'Zerodha - Demat', value: 'zerodha_demat' }, { label: 'Cash Wallet', value: 'cash' }
  ]},
  { key: 'tax_sections', label: 'ITR Deduction Sections', category: 'finance', type: 'dropdown_options', values: [
    { label: '80C - LIC/PPF/ELSS', value: '80C' }, { label: '80D - Health Insurance', value: '80D' },
    { label: 'HRA - House Rent', value: 'HRA' }, { label: '80E - Education Loan', value: '80E' },
    { label: 'Home Loan Interest', value: 'home_loan' }, { label: 'Business Expenses', value: 'business_exp' },
    { label: 'Standard Deduction', value: 'standard' }, { label: '80G - Donation', value: '80G' }
  ]},
  // System
  { key: 'public_form_enabled', label: 'Public Query Form Enabled', category: 'system', type: 'boolean', value: true },
  { key: 'backup_schedule', label: 'Auto Backup Schedule', category: 'system', type: 'string', value: 'weekly' },
  { key: 'whatsapp_enabled', label: 'WhatsApp Notifications', category: 'notifications', type: 'boolean', value: false },
];

const defaultFormFields = [
  { label: 'Full Name', fieldName: 'name', fieldType: 'text', placeholder: 'Your full name', isRequired: true, isActive: true, order: 0, isDefault: true },
  { label: 'Mobile / WhatsApp', fieldName: 'contact', fieldType: 'tel', placeholder: '10-digit mobile number', isRequired: true, isActive: true, order: 1, isDefault: true },
  { label: 'Email Address', fieldName: 'email', fieldType: 'email', placeholder: 'your@email.com', isRequired: false, isActive: true, order: 2, isDefault: true },
  { label: 'City', fieldName: 'city', fieldType: 'text', placeholder: 'Your city', isRequired: false, isActive: true, order: 3, isDefault: true },
  { label: 'Your Query / Message', fieldName: 'remarks', fieldType: 'textarea', placeholder: 'What would you like to know?', isRequired: false, isActive: true, order: 4, isDefault: true },
];

module.exports = async function seedAdmin() {
  try {
    // Seed admin
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: process.env.ADMIN_NAME || 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@querymaster.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        role: 'admin',
        permissions: {
          queries: { view: true, create: true, edit: true, delete: true, export: true },
          tasks: { view: true, create: true, edit: true, delete: true, export: true },
          finance: { view: true, create: true, edit: true, delete: true, export: true },
          admin: true
        }
      });
      console.log('✅ Admin user seeded');
    }

    // Seed default settings
    for (const setting of defaultSettings) {
      await SystemSetting.findOneAndUpdate({ key: setting.key }, setting, { upsert: true, new: true });
    }
    console.log('✅ Default settings seeded');

    // Seed default form fields
    for (const field of defaultFormFields) {
      await FormField.findOneAndUpdate({ fieldName: field.fieldName }, field, { upsert: true, new: true });
    }
    console.log('✅ Default form fields seeded');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  }
};
