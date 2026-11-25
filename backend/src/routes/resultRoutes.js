const express = require('express');
const router = express.Router();
const { getResults } = require('../controllers/resultController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getResults);

module.exports = router;
