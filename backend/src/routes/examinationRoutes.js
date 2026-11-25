const express = require('express');
const router = express.Router();
const {
  createExamination,
  getExaminations,
  getExaminationById,
  submitExamAttempt,
} = require('../controllers/examinationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getExaminations);
router.post('/', authorize('admin', 'staff', 'trainer'), createExamination);
router.get('/:id', getExaminationById);
router.post('/:id/submit', submitExamAttempt);

module.exports = router;
