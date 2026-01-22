import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const plansAPI = {
    // Get all active plans (public - for landing page)
    getActivePlans: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/plans`);
            return response.data;
        } catch (error) {
            console.error('Error fetching active plans:', error);
            throw error;
        }
    },

    // Get single plan by ID
    getPlanById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/plans/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching plan:', error);
            throw error;
        }
    },

    // Admin: Get all plans (including inactive)
    getAllPlans: async (token) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/plans/admin/all`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching all plans:', error);
            throw error;
        }
    },

    // Admin: Create new plan
    createPlan: async (planData, token) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/plans`, planData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating plan:', error);
            throw error;
        }
    },

    // Admin: Update plan
    updatePlan: async (id, planData, token) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/plans/${id}`, planData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating plan:', error);
            throw error;
        }
    },

    // Admin: Deactivate plan
    deactivatePlan: async (id, token) => {
        try {
            const response = await axios.patch(`${API_BASE_URL}/plans/${id}/deactivate`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error deactivating plan:', error);
            throw error;
        }
    },

    // Admin: Delete plan
    deletePlan: async (id, token) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/plans/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting plan:', error);
            throw error;
        }
    }
};

export default plansAPI;
