const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/userModel");
const Restaurant = require("../models/restaurantModel");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, password, role, restaurant_name, address, phone } =
    req.body;

  try {
    const userExists = await User.findByEmail(email);

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Calculate restaurant_id logic
    let restaurant_id = null;

    // If registering as owner, create a NEW restaurant
    if (!role || role === "restaurant_owner") {
      const newRestaurant = await Restaurant.create({
        name: restaurant_name || `${username}'s Restaurant`,
        address: address || null,
        contact_number: phone || null,
      });
      restaurant_id = newRestaurant.id;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password_hash,
      role: role || "restaurant_owner",
      restaurant_id: restaurant_id,
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
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Auth user & get token (with Remember Me support)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    const user = await User.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      // Determine token expiration based on rememberMe
      const tokenExpiry = rememberMe ? "30d" : "7d";

      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user.id, user.role, tokenExpiry),
        expiresIn: rememberMe ? "30 days" : "7 days",
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
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
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password_hash,
      role: "staff",
      restaurant_id: req.user.restaurant_id,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Staff registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findByEmail(email);

    if (!user) {
      return res
        .status(404)
        .json({ message: "No user found with that email address" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving to database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token and expiration (1 hour)
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await User.update(user.id, {
      reset_password_token: hashedToken,
      reset_password_expire: resetTokenExpiry,
    });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get("host")}/api/auth/reset-password/${resetToken}`;

    // Email message
    const message = `
            <h1>Password Reset Request</h1>
            <p>You requested a password reset for your account.</p>
            <p>Your token to reset your password is:</p>
            <p><strong>${resetToken}</strong></p>
            <p>This token will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        html: message,
      });

      res.status(200).json({
        success: true,
        message: "Password reset email sent",
        // In production, don't send the token in response
        // This is just for testing purposes
        ...(process.env.NODE_ENV === "development" && { resetToken }),
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);

      // Reset the token fields if email fails
      await User.update(user.id, {
        reset_password_token: null,
        reset_password_expire: null,
      });

      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Reset password using token
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  try {
    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Find user by token and check if not expired
    const user = await User.findByResetToken(hashedToken);

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Update password and clear reset token fields
    await User.update(user.id, {
      password_hash,
      reset_password_token: null,
      reset_password_expire: null,
    });

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      token: generateToken(user.id, user.role),
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Change password (for logged-in users)
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.update(user.id, { password_hash });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  registerStaff,
  forgotPassword,
  resetPassword,
  changePassword,
};
