import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import RestaurantSignup from '../pages/RestaurantSignup';
import Dashboard from '../pages/dashboard/Dashboard';
import StaffDashboard from '../pages/StaffDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import ResetPassword from '../pages/ResetPassword';
import VerifyOTP from '../pages/VerfiyOTP';
import ForgetPassword from '../pages/ForgetPassword';
import ProtectedRoute from "../routes/ProtectedRoute";
import DashboardHome from '../components/OwnerDashboard/DashboardHome';
import Orders from '../pages/dashboard/orders';
// import Settings from '../pages/dashboard/settings';
import DashboardLayout from '../pages/dashboard/DashboardLayout';

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
   {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute />}>

          <Route path="/dashboard" element={<DashboardLayout />}>

            <Route index element={<DashboardHome />} />
            <Route path="orders" element={<Orders />} />
            {/* <Route path="settings" element={<Settings />} /> */}

          </Route>

        </Route>

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