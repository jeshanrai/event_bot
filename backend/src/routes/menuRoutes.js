const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'tmp/csv/' });
const {
    getMenuItems,
    getCategories,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability,
    uploadMenuCsv
} = require('../controllers/menuController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes require authentication and restaurant_owner or staff role
router.use(protect);
router.use(authorize('restaurant_owner', 'staff', 'superadmin'));

// POST /api/menu/upload - Upload menu items via CSV
router.post('/upload', upload.single('file'), uploadMenuCsv);

// GET /api/menu - Get all menu items for the restaurant
router.get('/', getMenuItems);

// GET /api/menu/categories - Get categories with item counts
router.get('/categories', getCategories);

// GET /api/menu/:id - Get a single menu item
router.get('/:id', getMenuItem);

// POST /api/menu - Create a new menu item
router.post('/', createMenuItem);

// PUT /api/menu/:id - Update a menu item
router.put('/:id', updateMenuItem);

// DELETE /api/menu/:id - Delete a menu item
router.delete('/:id', deleteMenuItem);

// PATCH /api/menu/:id/availability - Toggle availability
router.patch('/:id/availability', toggleAvailability);

module.exports = router;
