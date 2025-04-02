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
    respondToRequest,
    getUserRequests
} = require('../controllers/exchangeController');

router.route('/')
    .post(protect, createExchange)
    .get(protect, getAllExchanges);

router.get('/requests/all', protect, getUserRequests);

router.route('/:id')
    .get(protect, getExchange)
    .put(protect, updateExchange)
    .delete(protect, deleteExchange);

router.get('/:id/matches', protect, findPotentialMatches);

router.post('/:id/request/:targetId', protect, sendExchangeRequest);

router.put('/:id/request/:requestId/respond', protect, respondToRequest);

module.exports = router;