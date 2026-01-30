import api from './api';

/**
 * Get all menu items for the authenticated user's restaurant
 * @param {string} category - Optional category filter
 */
export const getMenuItems = async (category = null) => {
    const params = category ? { category } : {};
    const response = await api.get('/menu', { params });
    return response.data;
};

/**
 * Get categories with item counts
 */
export const getCategories = async () => {
    const response = await api.get('/menu/categories');
    return response.data;
};

/**
 * Get a single menu item
 * @param {number} id - Menu item ID
 */
export const getMenuItem = async (id) => {
    const response = await api.get(`/menu/${id}`);
    return response.data;
};

/**
 * Create a new menu item
 * @param {Object} data - Menu item data
 */
export const createMenuItem = async (data) => {
    const response = await api.post('/menu', data);
    return response.data;
};

/**
 * Update a menu item
 * @param {number} id - Menu item ID
 * @param {Object} data - Updated data
 */
export const updateMenuItem = async (id, data) => {
    const response = await api.put(`/menu/${id}`, data);
    return response.data;
};

/**
 * Delete a menu item
 * @param {number} id - Menu item ID
 */
export const deleteMenuItem = async (id) => {
    const response = await api.delete(`/menu/${id}`);
    return response.data;
};

/**
 * Toggle availability of a menu item
 * @param {number} id - Menu item ID
 * @param {boolean} available - New availability status
 */
export const toggleAvailability = async (id, available) => {
    const response = await api.patch(`/menu/${id}/availability`, { available });
    return response.data;
};

/**
 * Upload menu items via CSV
 * @param {File} file - CSV file
 */
export const uploadMenuCsv = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/menu/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
