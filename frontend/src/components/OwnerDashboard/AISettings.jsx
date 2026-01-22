import React, { useState } from 'react';
import { Save, Bot, MessageSquare, Clock, Globe } from 'lucide-react';
import './OwnerDashboard.css';

const AISettings = () => {
    // Mock Settings
    const [settings, setSettings] = useState({
        greeting: "Welcome to RESTAURANT_NAME! I'm your AI assistant. How can I help you order today?",
        language: 'en',
        tone: 50, // 0 = Formal, 100 = Friendly/Casual
        upsellEnabled: true,
        hoursStart: '10:00',
        hoursEnd: '22:00'
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => setIsSaving(false), 1000);
    };

    return (
        <div className="ai-settings">
            <header className="frame-header">
                <div>
                    <h2 className="frame-title">AI Settings</h2>
                    <p className="frame-subtitle">Configure your chatbot's behavior</p>
                </div>
                <button className="primary-btn" onClick={handleSave} disabled={isSaving}>
                    <Save size={18} />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </header>

            <div className="ai-settings-container">

                {/* General Settings */}
                <section className="settings-section">
                    <h3><Bot size={20} /> General Configuration</h3>

                    <div className="form-group">
                        <label>Greeting Message</label>
                        <textarea
                            className="form-textarea"
                            value={settings.greeting}
                            onChange={(e) => handleChange('greeting', e.target.value)}
                            placeholder="Enter the first message the user sees..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Primary Language</label>
                        <div className="language-select-wrapper">
                            <select
                                className="form-select"
                                value={settings.language}
                                onChange={(e) => handleChange('language', e.target.value)}
                            >
                                <option value="en">English (US)</option>
                                <option value="np">Nepali</option>
                                <option value="es">Spanish</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Personality & Tone */}
                <section className="settings-section">
                    <h3><MessageSquare size={20} /> Personality & Tone</h3>

                    <div className="form-group">
                        <label>Conversation Style (Formal vs. Friendly)</label>
                        <div className="range-slider-container">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={settings.tone}
                                onChange={(e) => handleChange('tone', e.target.value)}
                                className="range-slider"
                            />
                            <div className="range-labels">
                                <span>Formal & Professional</span>
                                <span>Friendly & Casual</span>
                            </div>
                        </div>
                    </div>

                    <div className="toggle-row">
                        <div className="toggle-label">
                            <span>Smart Upselling</span>
                            <div className="toggle-desc">Allow AI to suggest add-ons and drinks.</div>
                        </div>
                        <label className="availability-switch">
                            <input
                                type="checkbox"
                                checked={settings.upsellEnabled}
                                onChange={(e) => handleChange('upsellEnabled', e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </section>

                {/* Operating Hours */}
                <section className="settings-section">
                    <h3><Clock size={20} /> Operating Hours</h3>
                    <p className="form-helper-text" style={{ marginBottom: '15px', color: '#64748b', fontSize: '14px' }}>
                        The chatbot will only accept orders during these hours.
                    </p>
                    <div className="hours-grid">
                        <div className="form-group">
                            <label>Opening Time</label>
                            <input
                                type="time"
                                className="form-input"
                                value={settings.hoursStart}
                                onChange={(e) => handleChange('hoursStart', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Closing Time</label>
                            <input
                                type="time"
                                className="form-input"
                                value={settings.hoursEnd}
                                onChange={(e) => handleChange('hoursEnd', e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Live Preview */}
                <div className="preview-box">
                    <div className="preview-header">Live Chat Simulator</div>
                    <div className="chat-bubble">
                        {settings.greeting}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AISettings;
