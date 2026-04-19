const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/walletController');
const { protect, can } = require('../middleware/auth');

router.use(protect);
router.get('/', can('finance', 'view'), ctrl.getWallets);
router.post('/', can('finance', 'create'), ctrl.createWallet);
router.put('/:id', can('finance', 'edit'), ctrl.updateWallet);
router.delete('/:id', can('finance', 'delete'), ctrl.deleteWallet);

module.exports = router;
