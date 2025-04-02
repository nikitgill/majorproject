const SkillExchange = require('../models/skillExchangeSchema');
const { findMatches, calculateMatchScore } = require('../utils/matchingAlgorithm');


exports.createExchange = async (req, res) => {
    try {
        req.body.user = req.user.id;
        console.log("Request received:", req.body);
        console.log("User ID from token:", req.user.id);
        const exchange = await SkillExchange.create(req.body);

        res.status(201).json({
            success: true,
            data: exchange
        });
    } catch (error) {

        console.error("Error creating exchange:", error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating exchange listing',
            error: error.message
        });

    }
};


exports.getAllExchanges = async (req, res) => {
    try {
        const exchanges = await SkillExchange.find({
            user: { $ne: req.user.id },
            is_active: true
        }).populate('user', 'name email rating');

        res.status(200).json({
            success: true,
            count: exchanges.length,
            data: exchanges
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching exchange listings',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


exports.getExchange = async (req, res) => {
    try {
        const exchange = await SkillExchange.findById(req.params.id)
            .populate('user', 'name email rating')
            .populate('matches.user', 'name email rating');

        if (!exchange) {
            return res.status(404).json({
                success: false,
                message: 'Exchange listing not found'
            });
        }

        res.status(200).json({
            success: true,
            data: exchange
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching exchange listing',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


exports.updateExchange = async (req, res) => {
    try {
        let exchange = await SkillExchange.findById(req.params.id);

        if (!exchange) {
            return res.status(404).json({
                success: false,
                message: 'Exchange listing not found'
            });
        }

        if (exchange.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'User not authorized to update this exchange'
            });
        }

        exchange = await SkillExchange.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: exchange
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating exchange listing',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


exports.deleteExchange = async (req, res) => {
    try {
        const exchange = await SkillExchange.findById(req.params.id);

        if (!exchange) {
            return res.status(404).json({
                success: false,
                message: 'Exchange listing not found'
            });
        }

        if (exchange.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'User not authorized to delete this exchange'
            });
        }

        await exchange.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting exchange listing',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


exports.findPotentialMatches = async (req, res) => {
    try {
        const exchange = await SkillExchange.findById(req.params.id);

        if (!exchange) {
            return res.status(404).json({
                success: false,
                message: 'Exchange listing not found'
            });
        }

        if (exchange.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'User not authorized to access matches for this exchange'
            });
        }

        const allExchanges = await SkillExchange.find({
            _id: { $ne: req.params.id },
            is_active: true,
            exchange_status: 'open'
        }).populate('user', 'name email rating');

        const matches = findMatches(exchange, allExchanges);

        res.status(200).json({
            success: true,
            count: matches.length,
            data: matches
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error finding matches',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


exports.sendExchangeRequest = async (req, res) => {
    try {
        const userExchange = await SkillExchange.findById(req.params.id);

        if (!userExchange) {
            return res.status(404).json({
                success: false,
                message: 'Exchange listing not found'
            });
        }

        if (userExchange.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'User not authorized to send requests from this exchange'
            });
        }

        const targetExchange = await SkillExchange.findById(req.params.targetId);

        if (!targetExchange) {
            return res.status(404).json({
                success: false,
                message: 'Target exchange listing not found'
            });
        }

        const existingMatch = targetExchange.matches.find(
            match => match.user.toString() === req.user.id
        );

        if (existingMatch) {
            return res.status(400).json({
                success: false,
                message: 'Exchange request already sent'
            });
        }

        const match_score = calculateMatchScore(userExchange, targetExchange);

        targetExchange.matches.push({
            user: req.user.id,
            match_score: match_score,
            exchange_request_status: 'pending'
        });

        await targetExchange.save();

        res.status(200).json({
            success: true,
            message: 'Exchange request sent successfully',
            match_score: match_score
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error sending exchange request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


exports.respondToRequest = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid status (accepted/rejected)'
            });
        }

        const exchange = await SkillExchange.findById(req.params.id);

        if (!exchange) {
            return res.status(404).json({
                success: false,
                message: 'Exchange listing not found'
            });
        }

        if (exchange.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'User not authorized to respond to requests for this exchange'
            });
        }

        const requestIndex = exchange.matches.findIndex(
            match => match._id.toString() === req.params.requestId
        );

        if (requestIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        exchange.matches[requestIndex].exchange_request_status = status;

        if (status === 'accepted') {
            exchange.exchange_status = 'pending';
        }

        await exchange.save();

        res.status(200).json({
            success: true,
            message: `Request ${status} successfully`,
            data: exchange
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error responding to request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getUserRequests = async (req, res) => {
    try {
        const receivedRequests = await SkillExchange.find({
            user: req.user.id,
            'matches.0': { $exists: true }
        }).populate('matches.user', 'name email rating');

        const sentRequests = await SkillExchange.find({
            'matches.user': req.user.id
        }).populate('user', 'name email rating');

        const formattedReceivedRequests = receivedRequests.map(exchange => {
            return {
                exchangeId: exchange._id,
                title: `Exchange listing: ${exchange.skills_offered.map(s => s.name).join(', ')}`,
                requests: exchange.matches.map(match => ({
                    requestId: match._id,
                    from: match.user,
                    status: match.exchange_request_status,
                    date: match.createdAt || exchange.updatedAt
                }))
            };
        });

        const formattedSentRequests = sentRequests.map(exchange => {
            const userRequest = exchange.matches.find(
                match => match.user._id.toString() === req.user.id ||
                    match.user.toString() === req.user.id
            );

            return {
                exchangeId: exchange._id,
                title: `Exchange listing by ${exchange.user.name}`,
                skills_offered: exchange.skills_offered.map(s => s.name).join(', '),
                skills_wanted: exchange.skills_wanted.map(s => s.name).join(', '),
                match_score: userRequest ? userRequest.match_score : 0,
                status: userRequest ? userRequest.exchange_request_status : 'unknown',
                date: userRequest?.createdAt || exchange.updatedAt
            };
        });

        res.status(200).json({
            success: true,
            count: {
                received: formattedReceivedRequests.length,
                sent: formattedSentRequests.length
            },
            data: {
                received: formattedReceivedRequests,
                sent: formattedSentRequests
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching exchange requests',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};