import React, { useState, useEffect, Children } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import OwnerSidebar from "../../components/OwnerDashboard/OwnerSidebar";
import DashboardHome from "../../components/OwnerDashboard/DashboardHome";
import OrdersManager from "../../components/OwnerDashboard/OrdersManager";
import MenuManager from "../../components/OwnerDashboard/MenuManager";
import AISettings from "../../components/OwnerDashboard/AISettings";
import Analytics from "../../components/OwnerDashboard/Analytics";
import StaffManager from "../../components/OwnerDashboard/StaffManager";
import ConnectHub from "../../components/OwnerDashboard/ConnectHub";
import Settings from "../../components/OwnerDashboard/Settings";
import "../../components/OwnerDashboard/OwnerDashboard.css";

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [activeFrame, setActiveFrame] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    if (user && user.role === "staff") navigate("/staff-dashboard");
  }, [user, loading, navigate]);

  if (loading) return <div>Loading...</div>;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="owner-dashboard">
      <OwnerSidebar
        activeFrame={activeFrame}
        onNavigate={(frame) => {
          setActiveFrame(frame);
          closeSidebar();
        }}
        onLogout={logout}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="mobile-sidebar-overlay" onClick={closeSidebar}></div>
      )}

      <main className="dashboard-content">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button className="mobile-menu-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <span className="mobile-brand">RestroAI</span>
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
