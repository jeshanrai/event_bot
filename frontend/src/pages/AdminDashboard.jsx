import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import SuperAdminSidebar from '../components/SuperAdminDashboard/SuperAdminSidebar';
import SuperAdminHome from '../components/SuperAdminDashboard/SuperAdminHome';
import RestaurantsList from '../components/SuperAdminDashboard/RestaurantsList';
import AIUsage from '../components/SuperAdminDashboard/AIUsage';
import BillingPlans from '../components/SuperAdminDashboard/BillingPlans';
import OrdersManager from '../components/SuperAdminDashboard/OrdersManager';
import RevenueAnalytics from '../components/SuperAdminDashboard/RevenueAnalytics';

const AdminDashboard = () => {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [activeFrame, setActiveFrame] = useState('home');

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
        if (user && user.role !== 'superadmin') {
            navigate('/dashboard'); // Kick out non-admins
        }
    }, [user, loading, navigate]);

    if (loading) return <div>Loading...</div>;

    const renderContent = () => {
        switch (activeFrame) {
            case 'home': return <SuperAdminHome />;
            case 'users': return <RestaurantsList />;
            case 'orders': return <OrdersManager />;
            case 'ai-usage': return <AIUsage />;
            case 'revenue': return <RevenueAnalytics />;
            case 'billing': return <BillingPlans />;
            case 'settings': return (
                <div style={{ padding: '40px' }}>
                    <h1 className="sa-title">Settings</h1>
                    <p className="sa-subtitle">System configurations and preferences</p>
                    <div style={{ 
                        marginTop: '30px', 
                        padding: '20px', 
                        background: '#f0f9ff', 
                        border: '1px solid #bae6fd', 
                        borderRadius: '8px' 
                    }}>
                        <p style={{ color: '#0c4a6e' }}>Settings page coming soon. You'll be able to configure system-wide settings here.</p>
                    </div>
                </div>
            );
            default: return <SuperAdminHome />;
        }
    };

    return (
        <div className="sa-dashboard-container">
            <SuperAdminSidebar
                activeFrame={activeFrame}
                onNavigate={setActiveFrame}
                onLogout={logout}
            />

            <main className="sa-main-content">
                {renderContent()}
            </main>
        </div>
    );
};

export default AdminDashboard;
