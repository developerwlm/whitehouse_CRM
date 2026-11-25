const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
  getLeads,
  getLeadById,
  createLead,
  publicWebsiteEnquiry,
  updateLead,
  addLeadActivity,
  bulkImportLeads,
  exportLeadsExcel,
  deleteLead,
} = require('../controllers/leadController');
const { protect, authorize, scopeLeadAccess } = require('../middleware/auth');

// Public enquiry endpoint from website
router.post('/enquiry', publicWebsiteEnquiry);

// Protected routes
router.use(protect);

router.get('/', authorize('admin', 'staff'), scopeLeadAccess, getLeads);
router.get('/export', authorize('admin', 'staff'), scopeLeadAccess, exportLeadsExcel);
router.post('/bulk-import', authorize('admin', 'staff'), upload.single('file'), bulkImportLeads);
router.post('/', authorize('admin', 'staff'), createLead);
router.get('/:id', authorize('admin', 'staff'), getLeadById);
router.put('/:id', authorize('admin', 'staff'), updateLead);
router.post('/:id/activities', authorize('admin', 'staff'), addLeadActivity);
router.delete('/:id', authorize('admin'), deleteLead);

module.exports = router;
