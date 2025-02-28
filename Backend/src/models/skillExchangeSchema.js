const mongoose = require('mongoose');

const skillExchangeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    skills_offered: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        proficiency: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'intermediate'
        }
    }],
    skills_wanted: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        }
    }],
    exchange_status: {
        type: String,
        enum: ['open', 'pending', 'completed', 'cancelled'],
        default: 'open'
    },
    matches: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        match_score: {
            type: Number,
            default: 0
        },
        exchange_request_status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        }
    }],
    location: {
        type: String,
        trim: true
    },
    availability: {
        days: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }],
        timeSlots: [{
            start: String,
            end: String
        }]
    },
    is_active: {
        type: Boolean,
        default: true
    },
    exchange_duration: {
        type: String,
        enum: ['one-time', 'short-term', 'long-term'],
        default: 'one-time'
    }
}, {
    timestamps: true
});


skillExchangeSchema.index({ user: 1 });
skillExchangeSchema.index({ is_active: 1, exchange_status: 1 });

const SkillExchange = mongoose.model('SkillExchange', skillExchangeSchema);
module.exports = SkillExchange;