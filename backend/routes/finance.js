const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/financeController');
const { protect, can } = require('../middleware/auth');

router.use(protect);
router.get('/summary', can('finance', 'view'), ctrl.getSummary);
router.get('/networth', can('finance', 'view'), ctrl.getNetWorth);

router.get('/transactions', can('finance', 'view'), ctrl.getTransactions);
router.post('/transactions', can('finance', 'create'), ctrl.createTransaction);
router.put('/transactions/:id', can('finance', 'edit'), ctrl.updateTransaction);
router.delete('/transactions/:id', can('finance', 'delete'), ctrl.deleteTransaction);

router.get('/investments', can('finance', 'view'), ctrl.getInvestments);
router.post('/investments', can('finance', 'create'), ctrl.createInvestment);
router.put('/investments/:id', can('finance', 'edit'), ctrl.updateInvestment);
router.delete('/investments/:id', can('finance', 'delete'), ctrl.deleteInvestment);

router.get('/tax-deductions', can('finance', 'view'), ctrl.getTaxDeductions);
router.post('/tax-deductions', can('finance', 'create'), ctrl.createTaxDeduction);
router.put('/tax-deductions/:id', can('finance', 'edit'), ctrl.updateTaxDeduction);
router.delete('/tax-deductions/:id', can('finance', 'delete'), ctrl.deleteTaxDeduction);

module.exports = router;
