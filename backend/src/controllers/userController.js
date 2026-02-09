const User = require("../models/userModel");
const db = require("../config/db");
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
        created_at: user.created_at,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// Delete staff member (Hard delete)
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    // Prevent self-deletion
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    // Get user to delete
    const userToDelete = await User.findById(id);

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Authorization checks
    // Only restaurant_owner can delete staff
    // Only superadmin can delete restaurant_owner
    if (currentUserRole === "restaurant_owner") {
      if (
        userToDelete.role === "restaurant_owner" ||
        userToDelete.role === "superadmin"
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this user",
        });
      }

      // Verify same restaurant
      if (userToDelete.restaurant_id !== req.user.restaurant_id) {
        return res.status(403).json({
          success: false,
          message: "You can only delete staff from your own restaurant",
        });
      }
    }

    // Prevent deleting superadmin unless you are superadmin
    if (
      userToDelete.role === "superadmin" &&
      currentUserRole !== "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only superadmin can delete superadmin accounts",
      });
    }

    // Perform deletion
    const deletedUser = await User.deleteById(id);

    res.json({
      success: true,
      message: `Staff member ${deletedUser.username} has been deleted successfully`,
      data: {
        id: deletedUser.id,
        email: deletedUser.email,
        username: deletedUser.username,
        role: deletedUser.role,
      },
    });
  } catch (error) {
    console.error("Delete staff error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete staff member",
      error: error.message,
    });
  }
};

// Deactivate staff member (Soft delete - Recommended)
const deactivateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    // Prevent self-deactivation
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    // Get user to deactivate
    const userToDeactivate = await User.findById(id);

    if (!userToDeactivate) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Authorization checks (same as delete)
    if (currentUserRole === "restaurant_owner") {
      if (
        userToDeactivate.role === "restaurant_owner" ||
        userToDeactivate.role === "superadmin"
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to deactivate this user",
        });
      }

      if (userToDeactivate.restaurant_id !== req.user.restaurant_id) {
        return res.status(403).json({
          success: false,
          message: "You can only deactivate staff from your own restaurant",
        });
      }
    }

    // Perform deactivation
    const deactivatedUser = await User.deactivate(id);

    res.json({
      success: true,
      message: `Staff member ${deactivatedUser.username} has been deactivated`,
      data: {
        id: deactivatedUser.id,
        email: deactivatedUser.email,
        username: deactivatedUser.username,
        role: deactivatedUser.role,
        is_active: deactivatedUser.is_active,
      },
    });
  } catch (error) {
    console.error("Deactivate staff error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate staff member",
      error: error.message,
    });
  }
};

// Reactivate staff member
const reactivateStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE users 
      SET 
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, username, role, is_active;
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      message: `Staff member ${user.username} has been reactivated`,
      data: user,
    });
  } catch (error) {
    console.error("Reactivate staff error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reactivate staff member",
      error: error.message,
    });
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

const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    // Get the user being updated
    const userToUpdate = await User.findById(id);

    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Authorization checks
    // 1. Restaurant owners can only update their own staff
    if (currentUserRole === "restaurant_owner") {
      if (userToUpdate.restaurant_id !== req.user.restaurant_id) {
        return res.status(403).json({
          success: false,
          message: "You can only update staff from your own restaurant",
        });
      }

      // Restaurant owners cannot update other owners or superadmins
      if (
        userToUpdate.role === "restaurant_owner" ||
        userToUpdate.role === "superadmin"
      ) {
        if (parseInt(id) !== currentUserId) {
          return res.status(403).json({
            success: false,
            message: "You do not have permission to update this user",
          });
        }
      }

      // Cannot promote to superadmin
      if (updates.role === "superadmin") {
        return res.status(403).json({
          success: false,
          message: "You cannot promote users to superadmin",
        });
      }
    }

    // 2. Staff can only update themselves (limited fields)
    if (currentUserRole === "staff") {
      if (parseInt(id) !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: "Staff can only update their own profile",
        });
      }

      // Staff cannot change their own role
      if (updates.role && updates.role !== userToUpdate.role) {
        return res.status(403).json({
          success: false,
          message: "You cannot change your own role",
        });
      }
    }

    // Validate email uniqueness if email is being changed
    if (updates.email && updates.email !== userToUpdate.email) {
      const existingUser = await User.findByEmail(updates.email);
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Validate allowed fields based on role
    const allowedFields = ["username", "email", "password", "role"];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    // Hash password if provided
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    // Perform update
    const updatedUser = await User.updateById(id, updateData);

    // Remove password from response
    delete updatedUser.password;

    res.json({
      success: true,
      message: `Staff member ${updatedUser.username} updated successfully`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update staff error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update staff member",
      error: error.message,
    });
  }
};

module.exports = {
  registerStaff,
  getUserProfile,
  deleteStaff,
  updateStaff,
  deactivateStaff,
  reactivateStaff,
};
