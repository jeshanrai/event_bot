import React, { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, Clock, Bot, TrendingUp } from 'lucide-react';
import api from '../../services/api';

const DashboardHome = () => {
    const [stats, setStats] = useState({
        todaysOrders: 0,
        revenueToday: 0,
        pendingOrders: 0,
        aiHandledPercentage: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/orders/stats');
                setStats(data);
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
        <div className="stat-card">
            <div className="stat-card-header">
                <div className={`stat-icon stat-icon--${color}`}>
                    <Icon size={24} />
                </div>
                {/* Mock trend for visualization purposes */}
                <div className="stat-trend stat-trend--up">
                    <TrendingUp size={16} />
                    <span>12%</span>
                </div>
            </div>
            <div className="stat-card-content">
                <div className="stat-value">{isLoading ? '...' : value}</div>
                <div className="stat-title">{title}</div>
                <div className="stat-subtitle">{subtitle}</div>
            </div>
        </div>
    );

    return (
        <div className="dashboard-home">
            <header className="frame-header">
                <h2 className="frame-title">Dashboard Overview</h2>
                <p className="frame-subtitle">Real-time metrics for today</p>
            </header>

            <div className="stats-grid">
                <StatCard
                    icon={ShoppingBag}
                    title="Today's Orders"
                    value={stats.todaysOrders}
                    subtitle="Total orders received today"
                    color="primary"
                />
                <StatCard
                    icon={DollarSign}
                    title="Revenue Today"
                    value={`Rs. ${stats.revenueToday.toLocaleString()}`}
                    subtitle="Total revenue generated today"
                    color="success"
                />
                <StatCard
                    icon={Clock}
                    title="Pending Orders"
                    value={stats.pendingOrders}
                    subtitle="Orders awaiting confirmation"
                    color="warning"
                />
                <StatCard
                    icon={Bot}
                    title="AI Handled"
                    value={`${stats.aiHandledPercentage}%`}
                    subtitle="Orders processed by AI"
                    color="info"
                />
            </div>
        </div>
    );
};

export default DashboardHome;
