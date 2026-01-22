import React from 'react';
import './Button.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    onClick,
    type = 'button',
    className = '',
    style = {}
}) => {
    return (
        <button
            type={type}
            className={`btn btn--${variant} btn--${size} ${disabled ? 'btn--disabled' : ''} ${className}`}
            onClick={onClick}
            disabled={disabled}
            style={style}
        >
            {children}
        </button>
    );
};

export default Button;
