import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Cpu, AlertCircle, Loader } from 'lucide-react';
import superAdminAPI from '../../services/superAdminApi';

const SuperAdminHome = () => {
    const [kpiData, setKpiData] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [kpiRes, userRes] = await Promise.all([
                    superAdminAPI.getDashboardKPIs(),
                    superAdminAPI.getUserStats()
                ]);

                setKpiData(kpiRes.data);
                setUserStats(userRes.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="sa-home" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Loader size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ color: '#64748b', marginTop: '20px' }}>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sa-home" style={{ padding: '20px' }}>
                <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <AlertCircle color="#dc2626" size={24} />
                    <div>
                        <strong style={{ color: '#991b1b' }}>Error Loading Dashboard</strong>
                        <p style={{ color: '#7f1d1d', fontSize: '14px' }}>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const kpis = kpiData?.kpis || {};

    return (
        <div className="sa-home">
            <div className="sa-header">
                <h1 className="sa-title">Super Admin Dashboard</h1>
                <p className="sa-subtitle">Overview of platform performance and metrics</p>
            </div>

            {/* KPI Cards */}
            <div className="sa-kpi-grid">
                <div className="sa-kpi-card">
                    <div className="sa-kpi-label">Total Users</div>
                    <div className="sa-kpi-value">{kpis.totalUsers || 0}</div>
                    <div className="sa-kpi-trend sa-trend-up">
                        <Users size={16} /> {userStats?.newUsersMonth || 0} this month
                    </div>
                </div>

                <div className="sa-kpi-card">
                    <div className="sa-kpi-label">Total Orders</div>
                    <div className="sa-kpi-value">{kpis.totalOrders?.toLocaleString() || 0}</div>
                    <div className="sa-kpi-trend sa-trend-up">
                        <TrendingUp size={16} /> {((kpis.completedOrders / kpis.totalOrders) * 100).toFixed(1)}% completed
                    </div>
                </div>

                <div className="sa-kpi-card">
                    <div className="sa-kpi-label">Total Revenue</div>
                    <div className="sa-kpi-value">₨{(kpis.totalRevenue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                    <div className="sa-kpi-trend sa-trend-up">
                        <DollarSign size={16} /> Avg ₨{(kpis.avgOrderValue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                </div>

                <div className="sa-kpi-card">
                    <div className="sa-kpi-label">Active Users (7d)</div>
                    <div className="sa-kpi-value">{userStats?.activeUsers || 0}</div>
                    <div className="sa-kpi-trend sa-trend-up">
                        <Cpu size={16} /> {kpis.rejectedOrders || 0} rejected
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="sa-charts-grid">
                <div className="sa-chart-card">
                    <div className="sa-chart-header">
                        <h3 className="sa-chart-title">Orders Over Time</h3>
                        <select className="sa-search" style={{ width: 'auto', padding: '6px' }}>
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    {/* Placeholder for Line Chart */}
                    <div style={{
                        height: '280px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        padding: '0 20px'
                    }}>
                        {[40, 65, 50, 80, 70, 90, 85].map((h, i) => (
                            <div key={i} style={{
                                width: '10%',
                                height: `${h}%`,
                                background: 'linear-gradient(to top, #c7d2fe, #818cf8)',
                                borderRadius: '6px 6px 0 0',
                                position: 'relative'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-25px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: '12px',
                                    color: '#64748b',
                                    fontWeight: '600'
                                }}>{h * 20}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px 0', fontSize: '13px', color: '#64748b', borderTop: '1px solid #f1f5f9' }}>
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="sa-charts-grid">
                <div className="sa-chart-card">
                    <div className="sa-chart-header">
                        <h3 className="sa-chart-title">Orders Trend (Last 7 Days)</h3>
                    </div>
                    {/* Dynamic Line Chart */}
                    <div style={{
                        height: '280px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        padding: '20px'
                    }}>
                        {kpiData?.dailyTrend && kpiData.dailyTrend.length > 0 ? (
                            <>
                                {(() => {
                                    const maxOrders = Math.max(...kpiData.dailyTrend.map(d => d.orders), 1);
                                    return kpiData.dailyTrend.map((day, i) => (
                                        <div key={i} style={{
                                            flex: 1,
                                            height: `${(day.orders / maxOrders) * 100}%`,
                                            background: 'linear-gradient(to top, #4f46e5, #818cf8)',
                                            borderRadius: '6px 6px 0 0',
                                            position: 'relative',
                                            margin: '0 4px',
                                            minHeight: '20px'
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '-25px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                fontSize: '12px',
                                                color: '#64748b',
                                                fontWeight: '600',
                                                whiteSpace: 'nowrap'
                                            }}>{day.orders}</div>
                                        </div>
                                    ));
                                })()}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#94a3b8', flex: 1 }}>No data available</div>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px 0', fontSize: '13px', color: '#64748b', borderTop: '1px solid #f1f5f9' }}>
                        {kpiData?.dailyTrend?.map((day, i) => (
                            <span key={i}>{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        ))}
                    </div>
                </div>

                <div className="sa-chart-card">
                    <div className="sa-chart-header">
                        <h3 className="sa-chart-title">Platform Distribution</h3>
                    </div>
                    {/* Pie Chart */}
                    <div style={{ height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
                        {(() => {
                            const platformData = kpiData?.platformBreakdown || {};
                            const platforms = Object.keys(platformData);
                            const total = Object.values(platformData).reduce((a, b) => a + b, 0) || 1;
                            
                            let gradient = 'conic-gradient(';
                            let currentPercent = 0;
                            const colors = {
                                'whatsapp': '#25D366',
                                'messenger': '#006AFF',
                                'web': '#FF6B35'
                            };
                            
                            platforms.forEach((platform, idx) => {
                                const percent = (platformData[platform] / total) * 100;
                                const color = colors[platform] || '#' + Math.floor(Math.random()*16777215).toString(16);
                                gradient += `${color} ${currentPercent}% ${currentPercent + percent}%`;
                                if (idx < platforms.length - 1) gradient += ', ';
                                currentPercent += percent;
                            });
                            gradient += ')';

                            return (
                                <>
                                    <div style={{
                                        width: '180px',
                                        height: '180px',
                                        borderRadius: '50%',
                                        background: gradient,
                                        position: 'relative',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: '120px',
                                            height: '120px',
                                            background: 'white',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'column'
                                        }}>
                                            <span style={{ fontSize: '24px', fontWeight: '800' }}>
                                                {platforms.length}
                                            </span>
                                            <span style={{ fontSize: '14px', color: '#64748b' }}>
                                                Channels
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        {platforms.map((platform) => (
                                            <div key={platform} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    background: colors[platform] || '#999',
                                                    borderRadius: '50%'
                                                }}></div>
                                                {platform.charAt(0).toUpperCase() + platform.slice(1)} ({platformData[platform]})
                                            </div>
                                        ))}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Status Breakdown */}
            <div className="sa-chart-card" style={{ marginTop: '20px' }}>
                <h3 className="sa-chart-title">Order Status Breakdown</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '15px',
                    padding: '20px 0'
                }}>
                    {(() => {
                        const statusData = kpiData?.statusBreakdown || {};
                        const statusColors = {
                            'completed': '#dcfce7',
                            'pending': '#fef3c7',
                            'preparing': '#dbeafe',
                            'rejected': '#fee2e2',
                            'cancelled': '#f3e8ff'
                        };
                        const statusTextColors = {
                            'completed': '#166534',
                            'pending': '#92400e',
                            'preparing': '#0c4a6e',
                            'rejected': '#991b1b',
                            'cancelled': '#6b21a8'
                        };

                        return Object.entries(statusData).map(([status, count]) => (
                            <div
                                key={status}
                                style={{
                                    padding: '15px',
                                    borderRadius: '8px',
                                    background: statusColors[status] || '#f1f5f9',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: '800',
                                    color: statusTextColors[status] || '#0f172a'
                                }}>
                                    {count}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: statusTextColors[status] || '#64748b',
                                    marginTop: '5px',
                                    textTransform: 'capitalize'
                                }}>
                                    {status}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminHome;
