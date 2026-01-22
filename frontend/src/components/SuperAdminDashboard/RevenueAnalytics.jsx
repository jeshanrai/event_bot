import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Loader, AlertCircle } from 'lucide-react';
import superAdminAPI from '../../services/superAdminApi';

const RevenueAnalytics = () => {
    const [revenueData, setRevenueData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRevenueData();
    }, []);

    const fetchRevenueData = async () => {
        try {
            setLoading(true);
            const res = await superAdminAPI.getRevenueAnalytics();
            setRevenueData(res.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching revenue data:', err);
            setError('Failed to load revenue analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="sa-revenue" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Loader size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ color: '#64748b', marginTop: '20px' }}>Loading revenue data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sa-revenue" style={{ padding: '20px' }}>
                <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <AlertCircle color="#dc2626" size={24} />
                    <div>
                        <strong style={{ color: '#991b1b' }}>Error Loading Revenue Data</strong>
                        <p style={{ color: '#7f1d1d', fontSize: '14px' }}>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const monthlyRevenue = revenueData?.monthlyRevenue || [];
    const paymentMethodRevenue = revenueData?.paymentMethodRevenue || [];
    const serviceTypeRevenue = revenueData?.serviceTypeRevenue || [];

    const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0);
    const totalOrders = monthlyRevenue.reduce((sum, m) => sum + m.orders, 0);
    const avgRevenuePerOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const paymentColors = {
        'cash': '#10b981',
        'esewa': '#8b5cf6',
        'khalti': '#f59e0b',
        'fonepay': '#3b82f6',
        'card': '#ec4899'
    };

    const serviceColors = {
        'dine_in': '#4f46e5',
        'delivery': '#0ea5e9',
        'pickup': '#f59e0b'
    };

    return (
        <div className="sa-revenue" style={{ padding: '20px' }}>
            <div className="sa-header">
                <h1 className="sa-title">Revenue Analytics</h1>
                <p className="sa-subtitle">Track revenue performance and breakdown by payment method and service type</p>
            </div>

            {/* Revenue KPIs */}
            <div className="sa-kpi-grid">
                <div className="sa-kpi-card">
                    <div className="sa-kpi-label">Total Revenue (30d)</div>
                    <div className="sa-kpi-value">₨{totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                    <div className="sa-kpi-trend sa-trend-up">
                        <TrendingUp size={16} /> {totalOrders} orders
                    </div>
                </div>

                <div className="sa-kpi-card">
                    <div className="sa-kpi-label">Avg Revenue Per Order</div>
                    <div className="sa-kpi-value">₨{avgRevenuePerOrder.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                    <div className="sa-kpi-trend sa-trend-up">
                        <DollarSign size={16} /> Healthy rate
                    </div>
                </div>

                <div className="sa-kpi-card">
                    <div className="sa-kpi-label">Total Orders (30d)</div>
                    <div className="sa-kpi-value">{totalOrders.toLocaleString()}</div>
                    <div className="sa-kpi-trend sa-trend-up">
                        <TrendingUp size={16} /> Growing
                    </div>
                </div>

                <div className="sa-kpi-card">
                    <div className="sa-kpi-label">Top Payment Method</div>
                    <div className="sa-kpi-value">
                        {paymentMethodRevenue.length > 0
                            ? paymentMethodRevenue[0].method.toUpperCase()
                            : 'N/A'}
                    </div>
                    <div className="sa-kpi-trend sa-trend-up">
                        <DollarSign size={16} /> Most used
                    </div>
                </div>
            </div>

            {/* Monthly Trend */}
            <div className="sa-chart-card" style={{ marginTop: '20px', marginBottom: '20px' }}>
                <h3 className="sa-chart-title">Monthly Revenue Trend</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '15px',
                    marginTop: '20px'
                }}>
                    {monthlyRevenue.length > 0 ? (
                        monthlyRevenue.map((month) => (
                            <div key={month.month} style={{
                                padding: '15px',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                textAlign: 'center',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
                                    {new Date(month.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#4f46e5', marginBottom: '6px' }}>
                                    ₨{(month.revenue / 1000).toFixed(1)}k
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                    {month.orders} orders
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#94a3b8' }}>No data available</p>
                    )}
                </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="sa-charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Payment Method Breakdown */}
                <div className="sa-chart-card">
                    <h3 className="sa-chart-title">Revenue by Payment Method</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                        {paymentMethodRevenue.length > 0 ? (
                            paymentMethodRevenue.map((method) => {
                                const percentage = (method.revenue / (paymentMethodRevenue.reduce((sum, m) => sum + m.revenue, 0) || 1)) * 100;

                                return (
                                    <div key={method.method}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '8px'
                                        }}>
                                            <span style={{
                                                color: '#0f172a',
                                                fontWeight: '600',
                                                textTransform: 'capitalize'
                                            }}>
                                                {method.method}
                                            </span>
                                            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                                                ₨{method.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            height: '10px',
                                            background: '#e2e8f0',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${percentage}%`,
                                                height: '100%',
                                                background: paymentColors[method.method] || '#4f46e5',
                                                borderRadius: '4px',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                                            {method.orders} orders
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ color: '#94a3b8' }}>No payment data available</p>
                        )}
                    </div>
                </div>

                {/* Service Type Breakdown */}
                <div className="sa-chart-card">
                    <h3 className="sa-chart-title">Revenue by Service Type</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                        {serviceTypeRevenue.length > 0 ? (
                            serviceTypeRevenue.map((service) => {
                                const percentage = (service.revenue / (serviceTypeRevenue.reduce((sum, s) => sum + s.revenue, 0) || 1)) * 100;

                                return (
                                    <div key={service.type}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '8px'
                                        }}>
                                            <span style={{
                                                color: '#0f172a',
                                                fontWeight: '600',
                                                textTransform: 'capitalize'
                                            }}>
                                                {service.type.replace(/_/g, ' ')}
                                            </span>
                                            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                                                ₨{service.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            height: '10px',
                                            background: '#e2e8f0',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${percentage}%`,
                                                height: '100%',
                                                background: serviceColors[service.type] || '#4f46e5',
                                                borderRadius: '4px',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                                            {service.orders} orders
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ color: '#94a3b8' }}>No service data available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Revenue Insights */}
            <div style={{
                marginTop: '30px',
                padding: '20px',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px'
            }}>
                <h4 style={{ color: '#0c4a6e', fontWeight: '600', marginBottom: '10px' }}>💡 Revenue Insights</h4>
                <ul style={{ color: '#0c4a6e', fontSize: '14px', marginLeft: '20px', margin: 0, paddingLeft: '20px' }}>
                    <li>Average order value is ₨{avgRevenuePerOrder.toLocaleString('en-US', { maximumFractionDigits: 0 })}</li>
                    <li>
                        Most popular payment method: <strong>
                            {paymentMethodRevenue.length > 0 ? paymentMethodRevenue[0].method : 'N/A'}
                        </strong>
                    </li>
                    <li>
                        Top service type: <strong>
                            {serviceTypeRevenue.length > 0 ? serviceTypeRevenue[0].type.replace(/_/g, ' ') : 'N/A'}
                        </strong>
                    </li>
                    <li>Consider promoting high-revenue payment methods and service types</li>
                </ul>
            </div>
        </div>
    );
};

export default RevenueAnalytics;
