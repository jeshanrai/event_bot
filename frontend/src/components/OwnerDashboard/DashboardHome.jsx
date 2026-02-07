import React, { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, Clock, Bot, TrendingUp,TrendingDown, Minus, Users } from 'lucide-react';
import api from '../../services/api';

const DashboardHome = () => {
    const [stats, setStats] = useState({
        todaysOrders: 0,
        revenueToday: 0,
        pendingOrders: 0,
        // aiHandledPercentage: 0,
        // totalCustomers: 0,
        // avgOrderValue: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [previousStats, setPreviousStats] = useState(null);

   useEffect(() => {
    const fetchStats = async () => {
        try {
            const { data } = await api.get('/orders/stats');

            const normalized = {
                todaysOrders: Number(data.todaysOrders),
                revenueToday: Number(data.revenueToday),
                pendingOrders: Number(data.pendingOrders),
                // aiHandledPercentage: Number(data.aiHandledPercentage),
                // totalCustomers: Number(data.totalCustomers),
                // avgOrderValue: Number(data.avgOrderValue)
            };

            setPreviousStats(prev => prev ? prev : normalized);   // store old stats
            setStats(normalized);      // update new stats

        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchStats();
     const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
}, []);

  const getTrend = (current, previous) => {
    if (previous === null || previous === undefined) {
        return { percent: 0, direction: "neutral" };
    }

    if (previous === 0 && current === 0) {
        return { percent: 0, direction: "neutral" };
    }

    if (previous === 0) {
        return { percent: 100, direction: "up" };
    }

    const diff = current - previous;
    const percent = Math.abs(((diff / previous) * 100)).toFixed(1);

    if (diff > 0) return { percent, direction: "up" };
    if (diff < 0) return { percent, direction: "down" };

    return { percent: 0, direction: "neutral" };
};
  const StatCard = ({ icon: Icon, title, value, subtitle, color, statKey }) => {

    const trend = previousStats
        ? getTrend(stats[statKey], previousStats[statKey])
        : { percent: 0, direction: "neutral" };

        const TrendIcon =
        trend.direction === "up"
            ? TrendingUp
            : trend.direction === "down"
            ? TrendingDown
            : Minus;

    return (
        <div className="stat-card">
            <div className="stat-card-header">
                <div className={`stat-icon stat-icon--${color}`}>
                    <Icon size={24} />
                </div>

                {trend.direction !== "neutral" && (
                    <div className={`stat-trend stat-trend--${trend.direction}`}>
                        <TrendIcon size={16} />
                        <span>{trend.percent}%</span>
                    </div>
                )}
            </div>

            <div className="stat-card-content">
                <div className="stat-value">{isLoading ? '...' : value}</div>
                <div className="stat-title">{title}</div>
                <div className="stat-subtitle">{subtitle}</div>
            </div>
        </div>
    );
};

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
                    statKey="todaysOrders"
                />
                <StatCard
                    icon={DollarSign}
                    title="Revenue Today"
                    value={`Rs. ${stats.revenueToday.toLocaleString()}`}
                    subtitle="Total revenue generated today"
                    color="success"
                    statKey="revenueToday"
                />
                <StatCard
                    icon={Clock}
                    title="Pending Orders"
                    value={stats.pendingOrders}
                    subtitle="Orders awaiting confirmation"
                    color="warning"
                    statKey="pendingOrders"
                />
                {/* <StatCard
                    icon={Bot}
                    title="AI Handled"
                    value={`${stats.aiHandledPercentage}%`}
                    subtitle="Orders processed by AI"
                    color="info"
                    statKey="aiHandledPercentage"
                />
                <StatCard
                    icon={Users}
                    title="Total Customers"
                    value={stats.totalCustomers}
                    subtitle="Customers served today"
                    color="primary"
                    statKey="totalCustomers"
                />

                <StatCard
                    icon={DollarSign}
                    title="Avg Order Value"
                    value={`Rs. ${stats.avgOrderValue.toLocaleString()}`}
                    subtitle="Average revenue per order"
                    color="success"
                    statKey="avgOrderValue"
                /> */}
            </div>
        </div>
    );
};

export default DashboardHome;
