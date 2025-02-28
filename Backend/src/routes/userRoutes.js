const express = require('express');
const {
    getUserProfile,
    updateUserProfile,
    changePassword,
    getUserExchangeHistory
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/:id', protect, getUserProfile);

router.put('/update', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);
router.get('/exchanges', protect, getUserExchangeHistory);

module.exports = router;