import React from 'react';
import { LogOut } from 'lucide-react';
import { getProgressInfo, getStatusLabel } from './utils/orderUtils';
import './OrderProgressSection.css';

const OrderProgressSection = ({ status, username, onLogout }) => {
    // For visual matching, we hardcode 1/4 or determine based on status index
    const statusMap = { 'pending': 1, 'accepted': 1, 'preparing': 2, 'ready': 3, 'delivered': 4 };
    const currentStep = statusMap[status] || 1;
    const totalSteps = 4;

    // Calculate progress percentage (0-100)
    const progressPercentage = (currentStep / totalSteps) * 100;

    // SVG circle properties
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

    return (
        <div className="progress-section">
            <div className="progress-left">
                <div className="circular-progress">
                    <svg className="progress-ring" width="70" height="70">
                        {/* Background circle */}
                        <circle
                            className="progress-ring-bg"
                            stroke="#E5E7EB"
                            strokeWidth="6"
                            fill="transparent"
                            r={radius}
                            cx="35"
                            cy="35"
                        />
                        {/* Progress circle */}
                        <circle
                            className="progress-ring-circle"
                            stroke="#4318FF"
                            strokeWidth="6"
                            fill="transparent"
                            r={radius}
                            cx="35"
                            cy="35"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: strokeDashoffset,
                                transform: 'rotate(-90deg)',
                                transformOrigin: '50% 50%',
                                transition: 'stroke-dashoffset 0.5s ease'
                            }}
                        />
                    </svg>
                    <span className="progress-text">
                        {currentStep}/{totalSteps}
                    </span>
                </div>
                <div className="progress-info">
                    <h3>{getStatusLabel(status)}</h3>
                    <p>Order execution starts automatically</p>
                </div>
            </div>

            <div className="manager-info">
                <span>Staff - <strong>{username || 'USER'}</strong></span>
                {onLogout && (
                    <button className="logout-btn" onClick={onLogout} title="Logout">
                        <LogOut size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default OrderProgressSection;
