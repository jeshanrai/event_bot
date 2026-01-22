import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { CheckCircle, Sparkles } from 'lucide-react';

const DoneStep = () => {
    const navigate = useNavigate();

    return (
        <div className="success-container">
            <div className="success-icon">
                <CheckCircle size={80} />
            </div>
            <h2 className="success-title">
                <Sparkles size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--color-primary)' }} />
                Success!
            </h2>
            <p className="success-message">
                Your restaurant has been successfully registered. You're all set to start receiving orders through AI-powered conversations.
            </p>

            <div style={{
                background: 'var(--color-primary-light)',
                padding: 'var(--spacing-4)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--spacing-8)',
                textAlign: 'left'
            }}>
                <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)', color: 'var(--color-neutral-dark)' }}>
                    What's Next?
                </div>
                <ul style={{
                    margin: 0,
                    paddingLeft: 'var(--spacing-6)',
                    color: 'var(--color-neutral-700)',
                    fontSize: '0.875rem',
                    lineHeight: '1.8'
                }}>
                    <li>Complete your menu setup</li>
                    <li>Configure your payment methods</li>
                    <li>Customize your chatbot responses</li>
                    <li>Start accepting orders!</li>
                </ul>
            </div>

            <Button
                variant="primary"
                size="large"
                onClick={() => navigate('/dashboard')}
                style={{ width: '100%' }}
            >
                Go to Dashboard →
            </Button>
        </div>
    );
};

export default DoneStep;
