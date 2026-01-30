const Menu = require('../models/menuModel');
const fs = require('fs');
const csv = require('csv-parser');

/**
 * Get all menu items for the authenticated user's restaurant
 * GET /api/menu
 */
const getMenuItems = async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;
        const { category } = req.query;

        if (!restaurantId) {
            return res.status(400).json({ message: 'Restaurant ID not found for user' });
        }

        const items = await Menu.findByRestaurantId(restaurantId, category);
        res.json(items);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ message: 'Error fetching menu items' });
    }
};

/**
 * Get categories with item counts
 * GET /api/menu/categories
 */
const getCategories = async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;

        if (!restaurantId) {
            return res.status(400).json({ message: 'Restaurant ID not found for user' });
        }

        const categories = await Menu.getCategories(restaurantId);
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
};

/**
 * Get a single menu item by ID
 * GET /api/menu/:id
 */
const getMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Menu.findById(id);

        if (!item) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Verify the item belongs to the user's restaurant
        if (item.restaurant_id !== req.user.restaurant_id) {
            return res.status(403).json({ message: 'Not authorized to access this item' });
        }

        res.json(item);
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({ message: 'Error fetching menu item' });
    }
};

/**
 * Create a new menu item
 * POST /api/menu
 */
const createMenuItem = async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;

        if (!restaurantId) {
            return res.status(400).json({ message: 'Restaurant ID not found for user' });
        }

        const { name, description, price, category, image_url, available } = req.body;

        // Validate required fields
        if (!name || !price || !category) {
            return res.status(400).json({ message: 'Name, price, and category are required' });
        }

        const item = await Menu.create({
            restaurant_id: restaurantId,
            name,
            description,
            price,
            category,
            image_url,
            available
        });

        res.status(201).json(item);
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ message: 'Error creating menu item' });
    }
};

/**
 * Update an existing menu item
 * PUT /api/menu/:id
 */
const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const existingItem = await Menu.findById(id);

        if (!existingItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Verify the item belongs to the user's restaurant
        if (existingItem.restaurant_id !== req.user.restaurant_id) {
            return res.status(403).json({ message: 'Not authorized to update this item' });
        }

        const { name, description, price, category, image_url, available } = req.body;
        const item = await Menu.update(id, { name, description, price, category, image_url, available });

        res.json(item);
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ message: 'Error updating menu item' });
    }
};

/**
 * Delete a menu item
 * DELETE /api/menu/:id
 */
const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const existingItem = await Menu.findById(id);

        if (!existingItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Verify the item belongs to the user's restaurant
        if (existingItem.restaurant_id !== req.user.restaurant_id) {
            return res.status(403).json({ message: 'Not authorized to delete this item' });
        }

        await Menu.delete(id);
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ message: 'Error deleting menu item' });
    }
};

/**
 * Toggle availability of a menu item
 * PATCH /api/menu/:id/availability
 */
const toggleAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { available } = req.body;

        if (typeof available !== 'boolean') {
            return res.status(400).json({ message: 'Available field must be a boolean' });
        }

        const existingItem = await Menu.findById(id);

        if (!existingItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Verify the item belongs to the user's restaurant
        if (existingItem.restaurant_id !== req.user.restaurant_id) {
            return res.status(403).json({ message: 'Not authorized to update this item' });
        }

        const item = await Menu.toggleAvailability(id, available);
        res.json(item);
    } catch (error) {
        console.error('Error toggling availability:', error);
        res.status(500).json({ message: 'Error toggling availability' });
    }
};

/**
 * Upload menu items via CSV
 * POST /api/menu/upload
 */
const uploadMenuCsv = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a CSV file' });
    }

    const results = [];
    const restaurantId = req.user.restaurant_id;

    if (!restaurantId) {
        return res.status(400).json({ message: 'Restaurant ID not found for user' });
    }

    try {
        const stream = fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => {
                // Map CSV columns to model fields and validate
                // Expected headers: name, price, category, description, image_url
                if (data.name && data.price && data.category) {
                    results.push({
                        restaurant_id: restaurantId,
                        name: data.name.trim(),
                        price: parseFloat(data.price),
                        category: data.category.trim(),
                        description: data.description ? data.description.trim() : null,
                        image_url: data.image_url ? data.image_url.trim() : null,
                        available: true
                    });
                }
            })
            .on('end', async () => {
                try {
                    // Process valid items
                    let successCount = 0;
                    let errorCount = 0;

                    for (const item of results) {
                        try {
                            await Menu.create(item);
                            successCount++;
                        } catch (err) {
                            console.error(`Error adding item ${item.name}:`, err);
                            errorCount++;
                        }
                    }

                    // Clean up uploaded file
                    fs.unlinkSync(req.file.path);

                    res.json({
                        message: 'CSV processing completed',
                        total: results.length,
                        success: successCount,
                        errors: errorCount
                    });
                } catch (error) {
                    console.error('Error processing CSV data:', error);
                    res.status(500).json({ message: 'Error processing CSV data' });
                }
            });

        stream.on('error', (error) => {
            console.error('CSV parse error:', error);
            res.status(500).json({ message: 'Error parsing CSV file' });
        });

    } catch (error) {
        console.error('Error in upload controller:', error);
        if (req.file && req.file.path) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Internal server error during upload' });
    }
};

module.exports = {
    getMenuItems,
    getCategories,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability,
    uploadMenuCsv
};
