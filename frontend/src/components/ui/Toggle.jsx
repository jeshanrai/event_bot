import React from 'react';
import './Toggle.css';

const Toggle = ({ label, checked, onChange, className = '' }) => {
    return (
        <label className={`toggle ${className}`}>
            <input
                type="checkbox"
                className="toggle-input"
                checked={checked}
                onChange={onChange}
            />
            <span className="toggle-slider"></span>
            {label && <span className="toggle-label">{label}</span>}
        </label>
    );
};

export default Toggle;
