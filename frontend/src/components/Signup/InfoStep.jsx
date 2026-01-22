import React from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

const InfoStep = ({ data, updateData, next }) => {
    const handleChange = (field, value) => {
        updateData({ [field]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (data.restaurantName && data.phone && data.email && data.password) {
            next();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <Input
                label="Restaurant Name"
                name="restaurantName"
                value={data.restaurantName}
                onChange={(e) => handleChange('restaurantName', e.target.value)}
                placeholder="e.g., The Golden Spoon"
                required
            />

            <Input
                label="Email Address"
                name="email"
                type="email"
                value={data.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="you@restaurant.com"
                required
            />

            <Input
                label="Password"
                name="password"
                type="password"
                value={data.password || ''}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Create a password"
                required
            />

            <Input
                label="Address"
                name="address"
                value={data.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Street address, City"
            />

            <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={data.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+977 98XXXXXXXX"
                required
            />

            <div>
                <label className="input-label" style={{ marginBottom: 'var(--spacing-3)', display: 'block' }}>
                    Restaurant Type <span className="input-required">*</span>
                </label>
                <div className="radio-group">
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="type"
                            value="dine-in"
                            checked={data.type === 'dine-in'}
                            onChange={(e) => handleChange('type', e.target.value)}
                        />
                        <span>Dine-in</span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="type"
                            value="cloud-kitchen"
                            checked={data.type === 'cloud-kitchen'}
                            onChange={(e) => handleChange('type', e.target.value)}
                        />
                        <span>Cloud Kitchen</span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="type"
                            value="both"
                            checked={data.type === 'both'}
                            onChange={(e) => handleChange('type', e.target.value)}
                        />
                        <span>Both</span>
                    </label>
                </div>
            </div>

            <Button type="submit" variant="primary" size="large" style={{ width: '100%' }}>
                Continue to Menu Setup
            </Button>
        </form>
    );
};

export default InfoStep;
