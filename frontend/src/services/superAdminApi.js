import api from './api';

const superAdminAPI = {
    // Dashboard
    getDashboardKPIs: () => api.get('/superadmin/dashboard'),
    getUserStats: () => api.get('/superadmin/user-stats'),
    getAIUsage: () => api.get('/superadmin/ai-usage'),
    getRevenueAnalytics: () => api.get('/superadmin/revenue'),

    // Users
    getAllUsers: (params) => api.get('/superadmin/users', { params }),
    
    // Orders
    getAllOrders: (params) => api.get('/superadmin/orders', { params }),
    getOrderDetails: (orderId) => api.get(`/superadmin/orders/${orderId}`),
    updateOrderStatus: (orderId, data) => api.put(`/superadmin/orders/${orderId}`, data),

    // Reservations
    getReservations: (params) => api.get('/superadmin/reservations', { params }),

    // Plans
    getAllPlans: () => api.get('/plans/admin/all'),
    createPlan: (data) => api.post('/plans', data),
    updatePlan: (id, data) => api.put(`/plans/${id}`, data),
    deletePlan: (id) => api.delete(`/plans/${id}`),
    deactivatePlan: (id) => api.patch(`/plans/${id}/deactivate`, {})
};

export default superAdminAPI;
