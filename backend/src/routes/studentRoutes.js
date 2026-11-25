const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  updateStudent,
  transferStudentBatch,
  uploadStudentDocument,
} = require('../controllers/studentController');
const { protect, authorize, scopeStudentAccess } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin', 'staff', 'trainer'), scopeStudentAccess, getStudents);
router.get('/:id', getStudentById); // scoped dynamically inside controller
router.put('/:id', authorize('admin', 'staff'), updateStudent);
router.post('/:id/transfer-batch', authorize('admin', 'staff'), transferStudentBatch);
router.post('/:id/documents', authorize('admin', 'staff'), uploadStudentDocument);

module.exports = router;
