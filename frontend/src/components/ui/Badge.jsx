import React from 'react';
import './Badge.css';

const Badge = ({ children, status = 'new', className = '' }) => {
    return (
        <span className={`badge badge--${status} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
