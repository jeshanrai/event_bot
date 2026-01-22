import React from 'react';
import './Input.css';

const Input = ({
    label,
    type = 'text',
    name,
    placeholder,
    value,
    onChange,
    helperText,
    error,
    required = false,
    className = ''
}) => {
    return (
        <div className={`input-wrapper ${className}`}>
            {label && (
                <label className="input-label">
                    {label}
                    {required && <span className="input-required">*</span>}
                </label>
            )}
            <input
                type={type}
                name={name}
                className={`input ${error ? 'input--error' : ''}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
            />
            {helperText && (
                <span className={`input-helper ${error ? 'input-helper--error' : ''}`}>
                    {helperText}
                </span>
            )}
        </div>
    );
};

export default Input;
