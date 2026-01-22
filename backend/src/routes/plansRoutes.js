const express = require('express');
const router = express.Router();
const {
    getActivePlans,
    getAllPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    deactivatePlan
} = require('../controllers/plansController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// =====================
// PUBLIC ROUTES
// =====================

// Get all active plans for landing page
router.get('/', getActivePlans);

// Get single plan by ID
router.get('/:id', getPlanById);

// =====================
// ADMIN ROUTES (Protected)
// =====================

// Get all plans (including inactive) - Admin only
router.get('/admin/all', protect, authorize('superadmin'), getAllPlans);

// Create new plan - Admin only
router.post('/', protect, authorize('superadmin'), createPlan);

// Update plan - Admin only
router.put('/:id', protect, authorize('superadmin'), updatePlan);

// Deactivate plan (soft delete) - Admin only
router.patch('/:id/deactivate', protect, authorize('superadmin'), deactivatePlan);

// Delete plan (hard delete) - Admin only
router.delete('/:id', protect, authorize('superadmin'), deletePlan);

module.exports = router;
