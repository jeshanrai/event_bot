import React from 'react';
import Logo from './Logo';
import '../styles/auth.css';

const AuthLayout = ({ children, title, subtitle, showLogo = true }) => {
    return (
        <div className="auth-container">
            {/* Animated Background Blobs */}
            <div className="auth-blob auth-blob-1"></div>
            <div className="auth-blob auth-blob-2"></div>

            {/* Auth Card */}
            <div className="auth-card">
                <div className="auth-header">
                    {showLogo && (
                        <div className="auth-logo">
                            <Logo size={40} />
                            <span>RestaurantAI</span>
                        </div>
                    )}
                    <h1 className="auth-title">{title}</h1>
                    {subtitle && <p className="auth-subtitle">{subtitle}</p>}
                </div>
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
