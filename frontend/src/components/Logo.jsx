import React from 'react';

const Logo = ({ size = 32, className = '' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Gradient Definitions */}
            <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4F46E5" />
                    <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
                <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
            </defs>

            {/* Main Circle Background */}
            <circle cx="24" cy="24" r="22" fill="url(#logoGradient)" opacity="0.1" />

            {/* Fork */}
            <path
                d="M16 14 L16 28 M14 14 L14 20 M18 14 L18 20"
                stroke="url(#logoGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
            />

            {/* Spoon */}
            <ellipse
                cx="32"
                cy="16"
                rx="3"
                ry="4"
                fill="url(#logoGradient)"
            />
            <path
                d="M32 20 L32 28"
                stroke="url(#logoGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
            />

            {/* AI Brain/Circuit */}
            <circle cx="24" cy="34" r="2" fill="url(#accentGradient)" />
            <circle cx="18" cy="32" r="1.5" fill="url(#accentGradient)" opacity="0.7" />
            <circle cx="30" cy="32" r="1.5" fill="url(#accentGradient)" opacity="0.7" />

            {/* Connection Lines */}
            <path
                d="M24 32 L24 34 M20 32 L24 34 M28 32 L24 34"
                stroke="url(#accentGradient)"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
            />
        </svg>
    );
};

export default Logo;
