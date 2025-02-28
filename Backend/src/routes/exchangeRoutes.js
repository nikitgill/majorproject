const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createExchange,
    getAllExchanges,
    getExchange,
    updateExchange,
    deleteExchange,
    findPotentialMatches,
    sendExchangeRequest,
    respondToRequest
} = require('../controllers/exchangeController');

router.route('/')
    .post(protect, createExchange)
    .get(protect, getAllExchanges);

router.route('/:id')
    .get(protect, getExchange)
    .put(protect, updateExchange)
    .delete(protect, deleteExchange);

router.get('/:id/matches', protect, findPotentialMatches);

router.post('/:id/request/:targetId', protect, sendExchangeRequest);

router.put('/:id/request/:requestId/respond', protect, respondToRequest);

module.exports = router;