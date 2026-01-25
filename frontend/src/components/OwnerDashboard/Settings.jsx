import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Check } from 'lucide-react';
import api from '../../services/api';
import './OwnerDashboard.css';

const Settings = () => {
    const [currency, setCurrency] = useState('AUD');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const currencies = [
        { code: 'AUD', name: 'Australian Dollar (AUD)' },
        { code: 'USD', name: 'United States Dollar (USD)' },
        { code: 'EUR', name: 'Euro (EUR)' },
        { code: 'GBP', name: 'British Pound (GBP)' },
        { code: 'CAD', name: 'Canadian Dollar (CAD)' },
        { code: 'JPY', name: 'Japanese Yen (JPY)' },
        { code: 'INR', name: 'Indian Rupee (INR)' },
        { code: 'NZD', name: 'New Zealand Dollar (NZD)' },
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/restaurant/settings');
            setCurrency(response.data.currency || 'AUD');
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await api.put('/restaurant/settings', { currency });
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
        } catch (error) {
            console.error('Error updating settings:', error);
            setMessage({ type: 'error', text: 'Failed to update settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading">Loading settings...</div>;

    return (
        <div className="dashboard-content-container">
            <div className="dashboard-header">
                <div>
                    <h1>Settings</h1>
                    <p>Manage your restaurant preferences</p>
                </div>
            </div>

            <div className="settings-container">
                <div className="section-header">Preferences</div>
                <div className="settings-section">
                    <div className="form-group">
                        <label>Preferred Currency</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="form-select"
                        >
                            {currencies.map((curr) => (
                                <option key={curr.code} value={curr.code}>
                                    {curr.name}
                                </option>
                            ))}
                        </select>
                        <p className="toggle-desc">
                            This currency will be used for all financial reports and menu items.
                        </p>
                    </div>
                </div>

                {message.text && (
                    <div className={`message-banner ${message.type}`} style={{
                        padding: '10px',
                        borderRadius: '6px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                        color: message.type === 'error' ? '#ef4444' : '#16a34a'
                    }}>
                        {message.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
                        {message.text}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="primary-btn"
                    style={{ opacity: saving ? 0.7 : 1 }}
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default Settings;
