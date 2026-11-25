const express = require('express');
const router = express.Router();
const {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  transferStudent,
} = require('../controllers/batchController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin', 'staff', 'trainer'), getBatches);
router.get('/:id', authorize('admin', 'staff', 'trainer'), getBatchById);
router.post('/', authorize('admin', 'staff'), createBatch);
router.put('/:id', authorize('admin', 'staff'), updateBatch);
router.post('/transfer-student', authorize('admin', 'staff'), transferStudent);

module.exports = router;
