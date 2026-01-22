const db = require('../config/db');

// @desc    Get all active plans (Public - for landing page)
// @route   GET /api/plans
// @access  Public
const getActivePlans = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, name, description, price, currency, billing_period, features, display_order
             FROM pricing_plans
             WHERE is_active = true
             ORDER BY display_order ASC`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pricing plans',
            error: error.message
        });
    }
};

// @desc    Get all plans including inactive (Admin only)
// @route   GET /api/superadmin/plans
// @access  Private/Superadmin
const getAllPlans = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, name, description, price, currency, billing_period, features, is_active, display_order, created_at, updated_at
             FROM pricing_plans
             ORDER BY display_order ASC`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pricing plans',
            error: error.message
        });
    }
};

// @desc    Get single plan by ID
// @route   GET /api/plans/:id
// @access  Public
const getPlanById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            `SELECT id, name, description, price, currency, billing_period, features, display_order
             FROM pricing_plans
             WHERE id = $1 AND is_active = true`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching plan',
            error: error.message
        });
    }
};

// @desc    Create new plan (Admin only)
// @route   POST /api/superadmin/plans
// @access  Private/Superadmin
const createPlan = async (req, res) => {
    try {
        const { name, description, price, currency, billing_period, features, display_order, is_active } = req.body;

        // Validation
        if (!name || !price || !description) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, and description are required'
            });
        }

        const result = await db.query(
            `INSERT INTO pricing_plans (name, description, price, currency, billing_period, features, is_active, display_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, name, description, price, currency, billing_period, features, is_active, display_order, created_at`,
            [
                name,
                description,
                price,
                currency || 'PKR',
                billing_period || 'monthly',
                JSON.stringify(features) || '{}',
                is_active !== undefined ? is_active : true,
                display_order || 999
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Plan created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating plan:', error);
        
        // Handle duplicate plan name
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Plan name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating plan',
            error: error.message
        });
    }
};

// @desc    Update plan (Admin only)
// @route   PUT /api/superadmin/plans/:id
// @access  Private/Superadmin
const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, currency, billing_period, features, is_active, display_order } = req.body;

        // Check if plan exists
        const planExists = await db.query('SELECT id FROM pricing_plans WHERE id = $1', [id]);
        if (planExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            values.push(description);
        }
        if (price !== undefined) {
            updates.push(`price = $${paramCount++}`);
            values.push(price);
        }
        if (currency !== undefined) {
            updates.push(`currency = $${paramCount++}`);
            values.push(currency);
        }
        if (billing_period !== undefined) {
            updates.push(`billing_period = $${paramCount++}`);
            values.push(billing_period);
        }
        if (features !== undefined) {
            updates.push(`features = $${paramCount++}`);
            values.push(JSON.stringify(features));
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramCount++}`);
            values.push(is_active);
        }
        if (display_order !== undefined) {
            updates.push(`display_order = $${paramCount++}`);
            values.push(display_order);
        }

        updates.push(`updated_at = NOW()`);

        if (updates.length === 1) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(id);
        const query = `UPDATE pricing_plans SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

        const result = await db.query(query, values);

        res.json({
            success: true,
            message: 'Plan updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating plan',
            error: error.message
        });
    }
};

// @desc    Delete plan (Admin only)
// @route   DELETE /api/superadmin/plans/:id
// @access  Private/Superadmin
const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if plan exists
        const planExists = await db.query('SELECT id FROM pricing_plans WHERE id = $1', [id]);
        if (planExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        await db.query('DELETE FROM pricing_plans WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Plan deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting plan',
            error: error.message
        });
    }
};

// @desc    Deactivate plan (soft delete)
// @route   PATCH /api/superadmin/plans/:id/deactivate
// @access  Private/Superadmin
const deactivatePlan = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'UPDATE pricing_plans SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        res.json({
            success: true,
            message: 'Plan deactivated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error deactivating plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error deactivating plan',
            error: error.message
        });
    }
};

module.exports = {
    getActivePlans,
    getAllPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    deactivatePlan
};
