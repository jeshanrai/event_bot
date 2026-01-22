import React, { useState, useEffect } from 'react';
import { BrainCircuit, MessageSquare, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import superAdminAPI from '../../services/superAdminApi';

const AIUsage = () => {
    const [aiUsage, setAiUsage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAIUsage();
    }, []);

    const fetchAIUsage = async () => {
        try {
            setLoading(true);
            const res = await superAdminAPI.getAIUsage();
            setAiUsage(res.data.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching AI usage:', err);
            setError('Failed to load AI usage data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="sa-ai-usage" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Loader size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ color: '#64748b', marginTop: '20px' }}>Loading AI usage data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sa-ai-usage" style={{ padding: '20px' }}>
                <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <AlertCircle color="#dc2626" size={24} />
                    <div>
                        <strong style={{ color: '#991b1b' }}>Error Loading AI Usage</strong>
                        <p style={{ color: '#7f1d1d', fontSize: '14px' }}>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const platformUsage = aiUsage?.platformUsage || [];
    const dailyBreakdown = aiUsage?.dailyBreakdown || [];
    const totalCalls = aiUsage?.totalCalls || 0;

    const platformColors = {
        'whatsapp': '#25D366',
        'messenger': '#006AFF',
        'web': '#FF6B35'
    };

    return (
        <div className="sa-ai-usage">
            <div className="sa-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="sa-title">AI Usage Analytics</h1>
                    <p className="sa-subtitle">Track LLM API calls by platform</p>
                </div>
                <button
                    onClick={fetchAIUsage}
                    disabled={loading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: loading ? '#e2e8f0' : '#4f46e5',
                        color: loading ? '#94a3b8' : 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="sa-kpi-grid">
                <div className="sa-kpi-card">
                    <div className="sa-kpi-label">Total LLM Calls (Last {aiUsage?.days || 7}d)</div>
                    <div className="sa-kpi-value">{totalCalls.toLocaleString()}</div>
                    <div className="sa-kpi-trend sa-trend-up">
                        <BrainCircuit size={16} /> API Calls
                    </div>
                </div>
                <div className="sa-kpi-card">
                    <div className="sa-kpi-label">Active Platforms</div>
                    <div className="sa-kpi-value">{platformUsage.length}</div>
                    <div className="sa-kpi-trend sa-trend-up">
                        <MessageSquare size={16} /> Platforms
                    </div>
                </div>
                <div className="sa-kpi-card">
                    <div className="sa-kpi-label">Most Used Platform</div>
                    <div className="sa-kpi-value" style={{ textTransform: 'capitalize' }}>
                        {platformUsage.length > 0 ? platformUsage[0].platform : 'N/A'}
                    </div>
                    <div className="sa-kpi-trend sa-trend-up">
                        <span style={{ color: platformUsage.length > 0 ? platformColors[platformUsage[0].platform] : '#64748b' }}>●</span>
                        {platformUsage.length > 0 ? platformUsage[0].total_calls : 0} calls
                    </div>
                </div>
            </div>

            {/* Platform Breakdown */}
            <div className="sa-chart-card" style={{ marginTop: '20px' }}>
                <h3 className="sa-chart-title">Platform LLM Usage Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    {platformUsage && platformUsage.length > 0 ? (
                        platformUsage.map((platform) => {
                            const calls = platform.total_calls || platform.llm_call_count || 0;
                            const percentage = totalCalls > 0 ? (calls / totalCalls) * 100 : 0;
                            return (
                                <div key={platform.platform}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '8px'
                                    }}>
                                        <span style={{
                                            color: '#0f172a',
                                            fontWeight: '600',
                                            textTransform: 'capitalize'
                                        }}>
                                            {platform.platform}
                                        </span>
                                        <span style={{ color: '#64748b', fontSize: '14px' }}>
                                            {(calls || 0).toLocaleString()} calls ({percentage.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '12px',
                                        background: '#e2e8f0',
                                        borderRadius: '6px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${percentage}%`,
                                            height: '100%',
                                            background: platformColors[platform.platform] || '#4f46e5',
                                            borderRadius: '6px',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                        Active for {platform.days_active || 0} day(s) • Last used: {platform.last_used ? new Date(platform.last_used).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p style={{ color: '#94a3b8', padding: '20px', textAlign: 'center' }}>No platform usage data available</p>
                    )}
                </div>
            </div>

            {/* Daily Trend Chart */}
            <div className="sa-chart-card" style={{ marginTop: '20px' }}>
                <h3 className="sa-chart-title">Daily LLM Calls Trend</h3>
                <div style={{
                    height: '280px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    padding: '20px',
                    gap: '8px'
                }}>
                    {dailyBreakdown.length > 0 ? (
                        (() => {
                            const maxCalls = Math.max(
                                ...dailyBreakdown.map(d => 
                                    Object.values(d.platforms || {}).reduce((a, b) => a + b, 0)
                                ), 
                                1
                            );
                            
                            return dailyBreakdown.map((day, i) => {
                                const dayTotal = Object.values(day.platforms || {}).reduce((a, b) => a + b, 0);
                                const barHeight = (dayTotal / maxCalls) * 100;
                                
                                return (
                                    <div key={i} style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        <div style={{
                                            width: '100%',
                                            height: '200px',
                                            background: '#f1f5f9',
                                            borderRadius: '6px',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'center',
                                            position: 'relative'
                                        }}>
                                            <div style={{
                                                width: '100%',
                                                height: `${barHeight}%`,
                                                background: 'linear-gradient(to top, #4f46e5, #7c3aed)',
                                                borderRadius: '4px',
                                                position: 'relative',
                                                display: 'flex',
                                                alignItems: 'flex-end',
                                                justifyContent: 'center',
                                                paddingBottom: '4px',
                                                minHeight: '4px'
                                            }}>
                                                <span style={{
                                                    fontSize: '11px',
                                                    color: 'white',
                                                    fontWeight: '600'
                                                }}>
                                                    {dayTotal}
                                                </span>
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '12px',
                                            color: '#64748b',
                                            fontWeight: '500'
                                        }}>
                                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                );
                            });
                        })()
                    ) : (
                        <div style={{ color: '#94a3b8', flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            No trend data available
                        </div>
                    )}
                </div>
            </div>

            {/* Platform Distribution Breakdown */}
            {platformUsage && platformUsage.length > 0 && (
                <div className="sa-chart-card" style={{ marginTop: '20px' }}>
                    <h3 className="sa-chart-title">Platform Details</h3>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        marginTop: '15px'
                    }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Platform</th>
                                <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Total Calls</th>
                                <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Days Active</th>
                                <th style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Last Used</th>
                            </tr>
                        </thead>
                        <tbody>
                            {platformUsage.map((platform) => (
                                <tr key={platform.platform} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', textAlign: 'left', textTransform: 'capitalize', fontWeight: '500', color: '#0f172a' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: platformColors[platform.platform] || '#ccc',
                                            marginRight: '8px'
                                        }} />
                                        {platform.platform}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center', color: '#0f172a', fontWeight: '600' }}>
                                        {(platform.total_calls || platform.llm_call_count || 0).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                                        {platform.days_active || 0}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontSize: '13px' }}>
                                        {platform.last_used ? new Date(platform.last_used).toLocaleDateString() : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AIUsage;
