import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import RestaurantSignup from '../pages/RestaurantSignup';
import Dashboard from '../pages/Dashboard';
import StaffDashboard from '../pages/StaffDashboard';
import AdminDashboard from '../pages/AdminDashboard';


const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<RestaurantSignup />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
        </Routes>
    );
};

export default AppRoutes;
