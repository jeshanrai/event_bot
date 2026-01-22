import React from 'react';
import { TrendingUp, Users, Clock, ArrowUpRight } from 'lucide-react';
import './OwnerDashboard.css';

const Analytics = () => {
    // Mock Data
    const bestSellers = [
        { name: 'Steamed Buff Momo', sales: 124, percentage: 45 },
        { name: 'Veg Chowmein', sales: 85, percentage: 30 },
        { name: 'Chicken Burger', sales: 42, percentage: 15 },
        { name: 'Coke / Fanta', sales: 28, percentage: 10 },
    ];

    const peakHours = [
        { hour: '11 AM', volume: 20 },
        { hour: '12 PM', volume: 65 },
        { hour: '1 PM', volume: 80 },
        { hour: '2 PM', volume: 45 },
        { hour: '3 PM', volume: 30 },
        { hour: '4 PM', volume: 40 },
        { hour: '5 PM', volume: 55 },
        { hour: '6 PM', volume: 90 },
        { hour: '7 PM', volume: 85 },
        { hour: '8 PM', volume: 50 },
    ];

    return (
        <div className="analytics-frame">
            <header className="frame-header">
                <div>
                    <h2 className="frame-title">Analytics</h2>
                    <p className="frame-subtitle">Insights into your business performance</p>
                </div>
            </header>

            <div className="analytics-grid">

                {/* Best Selling Items */}
                <div className="analytics-card">
                    <div className="card-header">
                        <h3>Best Selling Items</h3>
                        <TrendingUp size={18} className="text-green" />
                    </div>
                    <div className="metrics-list">
                        {bestSellers.map((item, index) => (
                            <div key={index} className="metric-item">
                                <div className="metric-info">
                                    <span className="metric-name">{item.name}</span>
                                    <span className="metric-value">{item.sales} sold</span>
                                </div>
                                <div className="progress-bg">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Peak Hours Chart */}
                <div className="analytics-card wide">
                    <div className="card-header">
                        <h3>Peak Hours (Orders)</h3>
                        <Clock size={18} className="text-blue" />
                    </div>
                    <div className="bar-chart">
                        {peakHours.map((data, index) => (
                            <div key={index} className="bar-column">
                                <div className="bar-wrapper">
                                    <div
                                        className="bar-fill"
                                        style={{ height: `${data.volume}%` }}
                                        title={`${data.volume} orders`}
                                    ></div>
                                </div>
                                <span className="bar-label">{data.hour}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Stats Row */}
                <div className="analytics-stats-row">
                    <div className="stat-box">
                        <div className="stat-icon-wrapper purple">
                            <Users size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Repeat Customers</span>
                            <div className="stat-num">
                                65%
                                <span className="trend positive"><ArrowUpRight size={14} /> 5%</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-box">
                        <div className="stat-icon-wrapper orange">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Conversion Rate</span>
                            <div className="stat-num">
                                8.2%
                                <span className="trend positive"><ArrowUpRight size={14} /> 1.2%</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Analytics;
