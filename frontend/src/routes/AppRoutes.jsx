import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import RestaurantSignup from '../pages/RestaurantSignup';
import Dashboard from '../pages/Dashboard';
import StaffDashboard from '../pages/StaffDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import ResetPassword from '../pages/ResetPassword';
import VerifyOTP from '../pages/VerfiyOTP';
import ForgetPassword from '../pages/ForgetPassword';


const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<RestaurantSignup />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
            <Route path="/forget-password" element={<ForgetPassword />} />
            <Route path="/verifyOTP" element={<VerifyOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            
        </Routes>
    );
};

export default AppRoutes;
