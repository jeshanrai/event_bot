import React from 'react';
import Button from '../ui/Button';
import Toggle from '../ui/Toggle';
import { MessageCircle, Globe } from 'lucide-react';

const ConnectStep = ({ data, updateData, next, back }) => {

    const handleConnectWhatsApp = () => {
        updateData({ whatsappConnected: !data.whatsappConnected });
    };

    return (
        <div className="auth-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div className="integration-card">
                    <div className="integration-info">
                        <div className="integration-icon" style={{ background: '#E7F5EC' }}>
                            <MessageCircle color="#25D366" size={24} />
                        </div>
                        <div className="integration-content">
                            <div className="integration-title">WhatsApp Integration</div>
                            <div className="integration-description">Receive orders on WhatsApp</div>
                        </div>
                    </div>
                    <Button
                        variant={data.whatsappConnected ? "secondary" : "primary"}
                        size="small"
                        onClick={handleConnectWhatsApp}
                    >
                        {data.whatsappConnected ? "Connected ✓" : "Connect"}
                    </Button>
                </div>

                <div className="integration-card">
                    <div className="integration-info">
                        <div className="integration-icon" style={{ background: '#EBF5FF' }}>
                            <Globe color="#3B82F6" size={24} />
                        </div>
                        <div className="integration-content">
                            <div className="integration-title">Web Widget</div>
                            <div className="integration-description">Enable ordering on your website</div>
                        </div>
                    </div>
                    <Toggle
                        checked={data.webWidgetEnabled}
                        onChange={(e) => updateData({ webWidgetEnabled: e.target.checked })}
                    />
                </div>
            </div>

            <div className="form-actions" style={{ marginTop: 'var(--spacing-8)' }}>
                <Button variant="ghost" onClick={back} style={{ flex: 1 }}>
                    Back
                </Button>
                <Button variant="primary" onClick={next} style={{ flex: 2 }}>
                    Complete Setup
                </Button>
            </div>
        </div>
    );
};

export default ConnectStep;
