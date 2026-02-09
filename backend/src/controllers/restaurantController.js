const Restaurant = require("../models/restaurantModel");
const User = require("../models/userModel");

const getSettings = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId || req.user.restaurant_id;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.status(200).json({
      currency: restaurant.currency || "AUD", // Default if not set
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateSettings = async (req, res) => {
  try {
    // Handle both camelCase and snake_case just in case
    const restaurantId = req.user.restaurantId || req.user.restaurant_id;
    const { currency } = req.body;

    console.log(
      `[updateSettings] User ID: ${req.user.id}, Restaurant ID: ${restaurantId}, Currency: ${currency}`,
    );

    if (!restaurantId) {
      console.error("[updateSettings] No restaurant ID found on user object");
      return res
        .status(400)
        .json({ message: "User is not linked to a restaurant" });
    }

    if (!currency) {
      return res.status(400).json({ message: "Currency is required" });
    }

    const updatedRestaurant = await Restaurant.updateCurrency(
      restaurantId,
      currency,
    );

    if (!updatedRestaurant) {
      console.error(
        `[updateSettings] Restaurant not found for ID: ${restaurantId}`,
      );
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.status(200).json({
      message: "Settings updated successfully",
      currency: updatedRestaurant.currency,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getStaff = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId || req.user.restaurant_id;

    if (!restaurantId) {
      return res
        .status(400)
        .json({ message: "User is not linked to a restaurant" });
    }

    const staff = await User.findByRestaurant(restaurantId);
    res.status(200).json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ message: "Server error fetching staff" });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getStaff,
};
