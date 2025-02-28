const User = require('../models/userSchema');
const SkillExchange = require('../models/skillExchangeSchema');
const bcrypt = require('bcrypt');


exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                skills_offered: user.skills_offered,
                skills_wanted: user.skills_wanted,
                rating: user.rating,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


exports.updateUserProfile = async (req, res) => {
    try {
        const { name, email, skills_offered, skills_wanted } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (name) user.name = name;

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already in use'
                });
            }
            user.email = email;
        }

        if (skills_offered) user.skills_offered = skills_offered;
        if (skills_wanted) user.skills_wanted = skills_wanted;

        user.updatedAt = Date.now();

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                skills_offered: user.skills_offered,
                skills_wanted: user.skills_wanted,
                rating: user.rating
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both current and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        user.updatedAt = Date.now();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


exports.getUserExchangeHistory = async (req, res) => {
    try {
        const createdExchanges = await SkillExchange.find({ user: req.user.id })
            .select('skills_offered skills_wanted exchange_status created_at updated_at')
            .sort({ created_at: -1 });

        const participatedExchanges = await SkillExchange.find({
            'matches.user': req.user.id,
            'matches.exchange_request_status': 'accepted'
        }).select('user skills_offered skills_wanted exchange_status created_at updated_at')
            .populate('user', 'name email')
            .sort({ created_at: -1 });

        res.status(200).json({
            success: true,
            count: {
                created: createdExchanges.length,
                participated: participatedExchanges.length
            },
            data: {
                created: createdExchanges,
                participated: participatedExchanges
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};