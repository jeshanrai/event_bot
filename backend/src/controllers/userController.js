const User = require('../models/userModel');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            res.json({
                _id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all users (Superadmin only)
// @route   GET /api/users
// @access  Private/Superadmin
const getUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

module.exports = {
    getUserProfile,
    getUsers,
};
