const express = require('express');
const router = express.Router();
const {
  getTrainers,
  getTrainerBatches,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} = require('../controllers/trainerController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin', 'staff', 'trainer'), getTrainers);
router.get('/:id/batches', authorize('admin', 'staff', 'trainer'), getTrainerBatches);
router.post('/', authorize('admin', 'staff'), createTrainer);
router.put('/:id', authorize('admin', 'staff'), updateTrainer);
router.delete('/:id', authorize('admin', 'staff'), deleteTrainer);

module.exports = router;
