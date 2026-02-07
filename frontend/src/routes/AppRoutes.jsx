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
import ProtectedRoute from "../routes/ProtectedRoute";

const AppRoutes = () => {
    return (
       <Routes>
  <Route path="/" element={<Login />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<RestaurantSignup />} />
  <Route path="/forget-password" element={<ForgetPassword />} />
  <Route path="/verifyOTP" element={<VerifyOTP />} />
  <Route path="/reset-password/:token" element={<ResetPassword />} />

  {/* Protected routes */}
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />

  <Route
    path="/admin-dashboard"
    element={
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    }
  />

  <Route
    path="/staff-dashboard"
    element={
      <ProtectedRoute>
        <StaffDashboard />
      </ProtectedRoute>
    }
  />
</Routes>
    );
};

export default AppRoutes;





{/* <Routes>
  <Route path="/" element={<Login />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<RestaurantSignup />} />
  <Route path="/forget-password" element={<ForgetPassword />} />
  <Route path="/verifyOTP" element={<VerifyOTP />} />
  <Route path="/reset-password/:token" element={<ResetPassword />} />

  {/* Protected routes */}
//   <Route
//     path="/dashboard"
//     element={
//       <ProtectedRoute>
//         <Dashboard />
//       </ProtectedRoute>
//     }
//   />

//   <Route
//     path="/admin-dashboard"
//     element={
//       <ProtectedRoute>
//         <AdminDashboard />
//       </ProtectedRoute>
//     }
//   />

//   <Route
//     path="/staff-dashboard"
//     element={
//       <ProtectedRoute>
//         <StaffDashboard />
//       </ProtectedRoute>
//     }
//   />
// </Routes> */}