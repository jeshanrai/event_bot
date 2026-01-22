import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import OrdersSidebar from '../components/StaffDashboard/OrdersSidebar';
import OrderDetailsPanel from '../components/StaffDashboard/OrderDetailsPanel';
import { useOrders } from '../components/StaffDashboard/hooks/useOrders';
import { filterOrders } from '../components/StaffDashboard/utils/orderUtils';
import ConfirmationModal from '../components/common/ConfirmationModal';
import './StaffDashboard.css';

const StaffDashboard = () => {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('all');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const openLogoutModal = () => setIsLogoutModalOpen(true);
    const closeLogoutModal = () => setIsLogoutModalOpen(false);

    const handleLogoutConfirm = () => {
        closeLogoutModal();
        logout();
    };

    const {
        orders,
        selectedOrder,
        isLoading,
        isRefreshing, // Kept for logic, though button moved
        unreadCount, // Kept for logic
        fetchOrders,
        updateOrderStatus,
        setSelectedOrder
    } = useOrders();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
        if (user && user.role !== 'staff' && user.role !== 'superadmin' && user.role !== 'restaurant_owner') {
            navigate('/');
        }
    }, [user, loading, navigate]);

    const filteredOrders = filterOrders(orders, activeFilter);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    if (loading) return <div className="loading-screen">Loading...</div>;

    return (
        <div className="modern-staff-dashboard">
            <div className={`dashboard-layout ${!isSidebarOpen ? 'sidebar-hidden' : ''}`}>
                {/* Sidebar now contains the "Task list" title header */}
                {isSidebarOpen && (
                    <OrdersSidebar
                        orders={filteredOrders}
                        allOrders={orders}
                        selectedOrder={selectedOrder}
                        activeFilter={activeFilter}
                        isLoading={isLoading}
                        onSelectOrder={setSelectedOrder}
                        onFilterChange={setActiveFilter}
                        onRefresh={fetchOrders}
                        onLogout={openLogoutModal}
                        onToggleSidebar={toggleSidebar}
                    />
                )}

                <main className="order-details-main">
                    <OrderDetailsPanel
                        order={selectedOrder}
                        user={user}
                        onStatusUpdate={updateOrderStatus}
                        onLogout={openLogoutModal}
                        onToggleSidebar={toggleSidebar}
                        isSidebarOpen={isSidebarOpen}
                    />
                </main>

                <ConfirmationModal
                    isOpen={isLogoutModalOpen}
                    onClose={closeLogoutModal}
                    onConfirm={handleLogoutConfirm}
                    title="Confirm Logout"
                    message="Are you sure you want to log out?"
                    confirmText="Logout"
                    isDestructive={true}
                />
            </div>
        </div>
    );
};

export default StaffDashboard;

