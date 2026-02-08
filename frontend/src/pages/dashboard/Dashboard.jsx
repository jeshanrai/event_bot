import React, { useState, useEffect } from "react";
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

// Placeholder components for future implementation
const PlaceholderFrame = ({ title }) => (
  <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
    <h2>{title}</h2>
    <p>This module is under construction.</p>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [activeFrame, setActiveFrame] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    if (user && user.role === "staff") navigate("/staff-dashboard");
  }, [user, loading, navigate]);

  if (loading) return <div>Loading...</div>;

  const renderContent = () => {
    switch (activeFrame) {
      case "home":
        return <DashboardHome />;
      case "orders":
        return <OrdersManager />;
      case "menu":
        return <MenuManager />;
      case "ai-settings":
        return <AISettings />;
      case "analytics":
        return <Analytics />;
      case "staff":
        return <StaffManager />;
      case "connect":
        return <ConnectHub />;
      case "settings":
        return <Settings />;
      default:
        return <DashboardHome />;
    }
  };

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
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
