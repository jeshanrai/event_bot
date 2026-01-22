import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await api.get('/users/profile');
                    setUser(data);
                } catch (error) {
                    console.error("Auth check failed:", error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        setUser(data);
        return data;
    };

    const register = async (userData) => {
        // userData maps to { username, email, password, restaurant_name, address, phone, ... }
        // Ensure username is mapped from restaurantName if needed, but RestaurantSignup passes restaurantName as username currently.
        // Let's expect the caller to format it correctly, or pass ...userData
        const { data } = await api.post('/auth/register', userData);
        localStorage.setItem('token', data.token);
        setUser(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
