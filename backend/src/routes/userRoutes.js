const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin', 'staff'), getUsers);
router.get('/:id', authorize('admin', 'staff'), getUserById);
router.post('/', authorize('admin', 'staff'), createUser);
router.put('/:id', authorize('admin', 'staff'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
