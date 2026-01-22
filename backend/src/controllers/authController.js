const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { username, email, password, role, restaurant_name, address, phone } = req.body; // Accept address and phone

    try {
        const userExists = await User.findByEmail(email);

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Calculate restaurant_id logic
        let restaurant_id = null;

        // If registering as owner, create a NEW restaurant
        if (!role || role === 'restaurant_owner') {
            const newRestaurant = await Restaurant.create({
                name: restaurant_name || `${username}'s Restaurant`,
                address: address || null,
                contact_number: phone || null
            });
            restaurant_id = newRestaurant.id;
        }

        // Note: If role is 'staff', we expect them to be created via registerStaff (which is protected/owner-only),
        // OR if public staff registration were allowed, we'd need to know WHICH restaurant.
        // For this public 'register' endpoint, we assume it's for OWNERS or generic users.

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            password_hash,
            role: role || 'restaurant_owner',
            restaurant_id: restaurant_id
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user.id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findByEmail(email);

        if (user && (await bcrypt.compare(password, user.password_hash))) {
            res.json({
                _id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user.id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Register a new staff member (Owner only)
// @route   POST /api/auth/register-staff
// @access  Private (Owner only)
const registerStaff = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await User.findByEmail(email);

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            password_hash,
            role: 'staff',
            restaurant_id: req.user.restaurant_id // Inherit restaurant_id from the owner
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    registerStaff
};
