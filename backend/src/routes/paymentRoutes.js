const express = require('express');
const router = express.Router();
const {
  recordPayment,
  downloadReceiptPdf,
  getPayments,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin', 'staff'), getPayments);
router.post('/', authorize('admin', 'staff'), recordPayment);
router.get('/:id/receipt-pdf', downloadReceiptPdf);

module.exports = router;
