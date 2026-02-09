import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import RestaurantSignup from "../pages/RestaurantSignup";
import Dashboard from "../pages/dashboard/Dashboard";
import StaffDashboard from "../pages/StaffDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import ResetPassword from "../pages/ResetPassword";
import VerifyOTP from "../pages/VerfiyOTP";
import ForgetPassword from "../pages/ForgetPassword";
import ProtectedRoute from "../routes/ProtectedRoute";
import DashboardHome from "../components/OwnerDashboard/DashboardHome";
import Orders from "../pages/dashboard/Orders";
import AISettingsPage from "../pages/dashboard/Settings";
// import Settings from '../pages/dashboard/settings';
import DashboardLayout from "../pages/dashboard/DashboardLayout";
import { Menu } from "lucide-react";
import Menus from "../pages/dashboard/Menus";
import Staffs from "../pages/dashboard/Staff";
import CONNECT from "../pages/dashboard/Connect";
import SettingsPage from "../pages/dashboard/Settings";
import AnalyticsPage from "../pages/dashboard/Analytics";

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
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardHome />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/orders"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Orders />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/menu"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Menus />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/ai-settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AISettingsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/staff"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Staffs />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/connect"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CONNECT />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <SettingsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/analytics"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AnalyticsPage />
            </DashboardLayout>
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

{
  /* <Routes>
  <Route path="/" element={<Login />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<RestaurantSignup />} />
  <Route path="/forget-password" element={<ForgetPassword />} />
  <Route path="/verifyOTP" element={<VerifyOTP />} />
  <Route path="/reset-password/:token" element={<ResetPassword />} />

  {/* Protected routes */
}
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
