import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  ChefHat, 
  TrendingUp, 
  TrendingDown,
  Users,
  Timer,
  PackageCheck,
  MessageSquare
} from 'lucide-react';
import api from '../../services/api';
import './OwnerDashboard.css';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    revenue: {
      today: 0,
      yesterday: 0,
      week: 0,
      month: 0,
      growth: 0
    },
    orders: {
      today: 0,
      byStatus: {
        created: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        completed: 0,
        cancelled: 0,
        delivered: 0
      },
      byPlatform: {
        whatsapp: 0,
        messenger: 0,
        web: 0
      },
      avgValue: 0
    },
    kitchen: {
      queueLength: 0,
      avgWaitTime: 0,
      avgPrepTime: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/orders/stats');
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className={`stat-icon stat-icon--${color}`}>
          <Icon size={24} />
        </div>
        {trend !== undefined && trend !== null && (
          <div className={`stat-trend stat-trend--${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
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

  const DetailCard = ({ title, children }) => (
    <div className="detail-card">
      <h3 className="detail-card-title">{title}</h3>
      <div className="detail-card-content">
        {children}
      </div>
    </div>
  );

  const StatusBar = ({ label, value, total, color }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className="status-bar-item">
        <div className="status-bar-label">
          <span>{label}</span>
          <span className="status-bar-value">{value}</span>
        </div>
        <div className="status-bar-progress">
          <div 
            className={`status-bar-fill status-bar-fill--${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  // Calculate total orders for percentage calculations
  const totalOrdersToday = stats.orders.today;
  const totalActiveOrders = stats.orders.byStatus.created + 
                           stats.orders.byStatus.confirmed + 
                           stats.orders.byStatus.preparing + 
                           stats.orders.byStatus.ready;

  return (
    <div className="dashboard-home">
      <header className="frame-header">
        <h2 className="frame-title">Dashboard Overview</h2>
        <p className="frame-subtitle">Real-time metrics and insights</p>
      </header>

      {/* Main Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon={DollarSign}
          title="Revenue Today"
          value={`Rs. ${parseFloat(stats.revenue.today).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`Yesterday: Rs. ${parseFloat(stats.revenue.yesterday).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          color="success"
          trend={parseFloat(stats.revenue.growth)}
        />
        
        <StatCard
          icon={ShoppingBag}
          title="Orders Today"
          value={stats.orders.today}
          subtitle={`Avg. value: Rs. ${parseFloat(stats.orders.avgValue).toFixed(2)}`}
          color="primary"
        />
        
        <StatCard
          icon={Clock}
          title="Active Orders"
          value={totalActiveOrders}
          subtitle={`${stats.kitchen.queueLength} in queue`}
          color="warning"
        />
        
        <StatCard
          icon={ChefHat}
          title="Kitchen Status"
          value={stats.kitchen.queueLength > 0 ? `${stats.kitchen.avgWaitTime} min` : 'Clear'}
          subtitle={stats.kitchen.queueLength > 0 ? 'Avg. wait time' : 'No pending orders'}
          color={stats.kitchen.queueLength > 5 ? 'danger' : 'info'}
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="stats-grid stats-grid--secondary">
        <DetailCard title="Revenue Overview">
          <div className="revenue-overview">
            <div className="revenue-item">
              <span className="revenue-label">This Week</span>
              <span className="revenue-value">Rs. {parseFloat(stats.revenue.week).toLocaleString('en-IN')}</span>
            </div>
            <div className="revenue-item">
              <span className="revenue-label">This Month</span>
              <span className="revenue-value">Rs. {parseFloat(stats.revenue.month).toLocaleString('en-IN')}</span>
            </div>
            <div className="revenue-item">
              <span className="revenue-label">Growth</span>
              <span className={`revenue-value revenue-value--${parseFloat(stats.revenue.growth) >= 0 ? 'positive' : 'negative'}`}>
                {parseFloat(stats.revenue.growth) >= 0 ? '+' : ''}{parseFloat(stats.revenue.growth).toFixed(1)}%
              </span>
            </div>
          </div>
        </DetailCard>

        <DetailCard title="Order Status Breakdown">
          <div className="status-breakdown">
            {stats.orders.byStatus.created > 0 && (
              <StatusBar 
                label="Created" 
                value={stats.orders.byStatus.created} 
                total={totalOrdersToday}
                color="secondary"
              />
            )}
            {stats.orders.byStatus.confirmed > 0 && (
              <StatusBar 
                label="Confirmed" 
                value={stats.orders.byStatus.confirmed} 
                total={totalOrdersToday}
                color="info"
              />
            )}
            {stats.orders.byStatus.preparing > 0 && (
              <StatusBar 
                label="Preparing" 
                value={stats.orders.byStatus.preparing} 
                total={totalOrdersToday}
                color="warning"
              />
            )}
            {stats.orders.byStatus.ready > 0 && (
              <StatusBar 
                label="Ready" 
                value={stats.orders.byStatus.ready} 
                total={totalOrdersToday}
                color="success"
              />
            )}
            {stats.orders.byStatus.delivered > 0 && (
              <StatusBar 
                label="Delivered" 
                value={stats.orders.byStatus.delivered} 
                total={totalOrdersToday}
                color="primary"
              />
            )}
            {stats.orders.byStatus.completed > 0 && (
              <StatusBar 
                label="Completed" 
                value={stats.orders.byStatus.completed} 
                total={totalOrdersToday}
                color="primary"
              />
            )}
            {stats.orders.byStatus.cancelled > 0 && (
              <StatusBar 
                label="Cancelled" 
                value={stats.orders.byStatus.cancelled} 
                total={totalOrdersToday}
                color="danger"
              />
            )}
            {totalOrdersToday === 0 && (
              <p className="no-data-message">No orders today yet</p>
            )}
          </div>
        </DetailCard>

        <DetailCard title="Order Channels">
          <div className="platform-breakdown">
            <div className="platform-item">
              <div className="platform-icon platform-icon--whatsapp">
                <MessageSquare size={20} />
              </div>
              <div className="platform-info">
                <span className="platform-name">WhatsApp</span>
                <span className="platform-count">{stats.orders.byPlatform.whatsapp} orders</span>
              </div>
            </div>
            <div className="platform-item">
              <div className="platform-icon platform-icon--messenger">
                <MessageSquare size={20} />
              </div>
              <div className="platform-info">
                <span className="platform-name">Messenger</span>
                <span className="platform-count">{stats.orders.byPlatform.messenger} orders</span>
              </div>
            </div>
            <div className="platform-item">
              <div className="platform-icon platform-icon--web">
                <Users size={20} />
              </div>
              <div className="platform-info">
                <span className="platform-name">Web</span>
                <span className="platform-count">{stats.orders.byPlatform.web} orders</span>
              </div>
            </div>
          </div>
        </DetailCard>

        <DetailCard title="Kitchen Performance">
          <div className="kitchen-metrics">
            <div className="kitchen-metric">
              <Timer size={24} className="kitchen-metric-icon" />
              <div className="kitchen-metric-content">
                <span className="kitchen-metric-label">Avg. Prep Time</span>
                <span className="kitchen-metric-value">
                  {stats.kitchen.avgPrepTime > 0 ? `${stats.kitchen.avgPrepTime} min` : 'N/A'}
                </span>
              </div>
            </div>
            <div className="kitchen-metric">
              <PackageCheck size={24} className="kitchen-metric-icon" />
              <div className="kitchen-metric-content">
                <span className="kitchen-metric-label">Queue Length</span>
                <span className="kitchen-metric-value">
                  {stats.kitchen.queueLength} {stats.kitchen.queueLength === 1 ? 'order' : 'orders'}
                </span>
              </div>
            </div>
            <div className="kitchen-metric">
              <Clock size={24} className="kitchen-metric-icon" />
              <div className="kitchen-metric-content">
                <span className="kitchen-metric-label">Est. Wait Time</span>
                <span className="kitchen-metric-value">
                  {stats.kitchen.avgWaitTime > 0 ? `${stats.kitchen.avgWaitTime} min` : 'None'}
                </span>
              </div>
            </div>
          </div>
        </DetailCard>
      </div>

      {/* Quick Stats Footer */}
      <div className="quick-stats">
        <div className="quick-stat">
          <span className="quick-stat-label">Completion Rate</span>
          <span className="quick-stat-value">
            {totalOrdersToday > 0 
              ? ((stats.orders.byStatus.completed + stats.orders.byStatus.delivered) / totalOrdersToday * 100).toFixed(1)
              : 0
            }%
          </span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-label">Active Orders</span>
          <span className="quick-stat-value">{totalActiveOrders}</span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-label">Last Updated</span>
          <span className="quick-stat-value">
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
