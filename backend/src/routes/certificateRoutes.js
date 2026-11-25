const express = require('express');
const router = express.Router();
const {
  recommendCertificate,
  approveCertificate,
  downloadCertificatePdf,
  verifyPublicCertificate,
  getCertificates,
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

// Public verification endpoint for QR code scans
router.get('/verify/:certificateId', verifyPublicCertificate);

// Protected endpoints
router.use(protect);

router.get('/', authorize('admin', 'staff', 'trainer'), getCertificates);
router.post('/recommend', authorize('admin', 'staff', 'trainer'), recommendCertificate);
router.post('/:id/approve', authorize('admin'), approveCertificate);
router.get('/:id/pdf', downloadCertificatePdf);

module.exports = router;
