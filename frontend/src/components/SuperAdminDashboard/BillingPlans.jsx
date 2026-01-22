import React, { useState, useEffect } from 'react';
import { Check, Edit2, Save, AlertCircle, Loader } from 'lucide-react';
import superAdminAPI from '../../services/superAdminApi';

const BillingPlans = () => {
    const [plans, setPlans] = useState([]);
    const [originalPlans, setOriginalPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    // Fetch plans on component mount
    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await superAdminAPI.getAllPlans();
            if (response.data && response.data.data) {
                const plansData = response.data.data.map(plan => ({
                    ...plan,
                    features: Array.isArray(plan.features) ? plan.features : (plan.features ? Object.entries(plan.features).map(([key, value]) => ({ name: key, included: value })) : [])
                }));
                setPlans(plansData);
                setOriginalPlans(JSON.parse(JSON.stringify(plansData)));
            }
        } catch (err) {
            console.error('Error fetching plans:', err);
            setError('Failed to load pricing plans. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePriceChange = (id, newPrice) => {
        setPlans(plans.map(p => p.id === id ? { ...p, price: parseFloat(newPrice) || 0 } : p));
    };

    const handleDescriptionChange = (id, newDescription) => {
        setPlans(plans.map(p => p.id === id ? { ...p, description: newDescription } : p));
    };

    const handleFeatureToggle = (planId, featureIndex) => {
        setPlans(plans.map(p => 
            p.id === planId 
                ? {
                    ...p,
                    features: p.features.map((f, idx) => 
                        idx === featureIndex ? { ...f, included: !f.included } : f
                    )
                }
                : p
        ));
    };

    const handleFeatureNameChange = (planId, featureIndex, newName) => {
        setPlans(plans.map(p =>
            p.id === planId
                ? {
                    ...p,
                    features: p.features.map((f, i) =>
                        i === featureIndex ? { ...f, name: newName } : f
                    )
                }
                : p
        ));
    };

    const handleAddNewFeature = (planId) => {
        setPlans(plans.map(p =>
            p.id === planId
                ? {
                    ...p,
                    features: [...p.features, { name: 'New Feature', included: false }]
                }
                : p
        ));
    };

    const handleRemoveFeature = (planId, featureIndex) => {
        setPlans(plans.map(p =>
            p.id === planId
                ? {
                    ...p,
                    features: p.features.filter((f, i) => i !== featureIndex)
                }
                : p
        ));
    };

    const handleSaveChanges = async () => {
        try {
            setSaving(true);
            setError(null);

            // Save each modified plan
            for (const plan of plans) {
                const originalPlan = originalPlans.find(p => p.id === plan.id);
                
                // Check if plan has been modified
                const hasChanges = JSON.stringify(plan) !== JSON.stringify(originalPlan);
                
                if (hasChanges) {
                    const updateData = {
                        name: plan.name,
                        description: plan.description,
                        price: plan.price,
                        currency: plan.currency,
                        billing_period: plan.billing_period,
                        features: plan.features.reduce((acc, feat) => {
                            acc[feat.name] = feat.included;
                            return acc;
                        }, {}),
                        is_active: plan.is_active,
                        display_order: plan.display_order
                    };
                    
                    await superAdminAPI.updatePlan(plan.id, updateData);
                }
            }

            setSuccess(true);
            setOriginalPlans(JSON.parse(JSON.stringify(plans)));
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving plans:', err);
            setError(err.response?.data?.message || 'Failed to save plans. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = JSON.stringify(plans) !== JSON.stringify(originalPlans);

    if (loading) {
        return (
            <div className="sa-billing-plans">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '400px'
                }}>
                    <Loader size={40} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="sa-billing-plans">
            <div className="sa-header">
                <h1 className="sa-title">Billing & Plans</h1>
                <p className="sa-subtitle">Manage subscription plans and pricing structures</p>
            </div>

            {error && (
                <div style={{
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px'
                }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div style={{
                    background: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px'
                }}>
                    <Check size={18} />
                    Plans updated successfully!
                </div>
            )}

            {plans.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#64748b'
                }}>
                    <p>No plans available. Create your first plan to get started.</p>
                </div>
            ) : (
                <>
                    <div className="sa-billing-grid">
                        {plans.map(plan => (
                            <div key={plan.id} className="sa-plan-card">
                                <div className="sa-plan-header">
                                    <h3 className="sa-plan-name">{plan.name}</h3>
                                    <div className="sa-plan-price">
                                        <span>₨</span>
                                        <input
                                            type="number"
                                            value={plan.price}
                                            onChange={(e) => handlePriceChange(plan.id, e.target.value)}
                                            style={{
                                                width: '120px',
                                                fontSize: '32px',
                                                fontWeight: '800',
                                                border: 'none',
                                                borderBottom: '2px solid rgba(79, 70, 229, 0.2)',
                                                color: '#4f46e5',
                                                textAlign: 'center',
                                                background: 'transparent',
                                                padding: '5px 0'
                                            }}
                                        />
                                        <span>/mo</span>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={plan.description || ''}
                                        onChange={(e) => handleDescriptionChange(plan.id, e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '24px', padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                                    <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                                        Billing Period
                                    </label>
                                    <select
                                        value={plan.billing_period || 'monthly'}
                                        onChange={(e) => setPlans(plans.map(p => p.id === plan.id ? { ...p, billing_period: e.target.value } : p))}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="one-time">One Time</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ color: '#0f172a', fontWeight: '600', fontSize: '14px' }}>Features</h4>
                                        <button
                                            onClick={() => handleAddNewFeature(plan.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#4f46e5',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            + Add Feature
                                        </button>
                                    </div>
                                    <ul className="sa-feature-list">
                                        {plan.features && plan.features.map((feature, idx) => (
                                            <li key={idx} className="sa-feature-item" style={{ opacity: feature.included ? 1 : 0.6, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={feature.included}
                                                    onChange={() => handleFeatureToggle(plan.id, idx)}
                                                    style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        cursor: 'pointer',
                                                        accentColor: '#4f46e5',
                                                        flexShrink: 0
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    value={feature.name}
                                                    onChange={(e) => handleFeatureNameChange(plan.id, idx, e.target.value)}
                                                    style={{
                                                        border: 'none',
                                                        background: 'transparent',
                                                        flex: 1,
                                                        padding: '4px',
                                                        fontSize: '14px',
                                                        color: '#0f172a',
                                                        minWidth: 0
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleRemoveFeature(plan.id, idx)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#dc2626',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div style={{
                                    padding: '12px',
                                    background: '#f0f4ff',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    color: '#4f46e5',
                                    fontWeight: '500'
                                }}>
                                    {plan.features && plan.features.filter(f => f.included).length} / {plan.features && plan.features.length} features included
                                </div>

                                <div style={{ marginTop: '12px', padding: '12px', background: '#fef3c7', borderRadius: '6px', fontSize: '12px', color: '#92400e', display: plan.is_active ? 'none' : 'block' }}>
                                    ⚠️ This plan is currently inactive
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '40px', textAlign: 'right' }}>
                        {hasChanges && (
                            <p style={{ fontSize: '13px', color: '#f59e0b', marginBottom: '12px', textAlign: 'right' }}>
                                You have unsaved changes
                            </p>
                        )}
                        <button
                            className="sa-btn-primary"
                            onClick={handleSaveChanges}
                            disabled={saving || !hasChanges}
                            style={{
                                padding: '12px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginLeft: 'auto',
                                opacity: (saving || !hasChanges) ? 0.7 : 1,
                                cursor: (saving || !hasChanges) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {saving ? (
                                <>
                                    <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save All Changes
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default BillingPlans;
