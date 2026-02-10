import React, { useEffect, useState, useRef } from 'react';
import { MessageCircle, CheckCircle, AlertCircle, Facebook } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import './OwnerDashboard.css';

const ConnectHub = () => {
    const { user } = useAuth(); // Get user context
    const [activeTab, setActiveTab] = useState('whatsapp');
    const [isSDKLoaded, setIsSDKLoaded] = useState(false);
    // These status states are for immediate feedback (success/error messages)
    const [whatsappStatus, setWhatsappStatus] = useState(null);
    const [facebookStatus, setFacebookStatus] = useState(null);
    const [signupData, setSignupData] = useState(null);

    // Refs to coordinate FB.login callback + WA_EMBEDDED_SIGNUP message event
    const signupDataRef = useRef(null);
    const accessTokenRef = useRef(null);
    const hasSentRef = useRef(false);
    const sendTimerRef = useRef(null);

    // Persistent connection data fetched from backend
    const [connectionData, setConnectionData] = useState({
        whatsapp: { connected: false, data: null },
        facebook: { connected: false, data: null }
    });

    // Shared function: sends WhatsApp credentials to backend once token + signup data are ready
    const sendWhatsAppToBackend = () => {
        if (hasSentRef.current) return;
        const token = accessTokenRef.current;
        if (!token) return;

        hasSentRef.current = true;
        if (sendTimerRef.current) clearTimeout(sendTimerRef.current);

        const data = signupDataRef.current;
        console.log('[ConnectHub] Sending to backend:', {
            hasToken: !!token,
            waba_id: data?.waba_id,
            phone_number_id: data?.phone_number_id || data?.phone_id,
            restaurant_id: user?.restaurant_id
        });

        setWhatsappStatus({ type: 'success', message: 'Processing connection...' });

        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/whatsapp/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include',
            body: JSON.stringify({
                access_token: token,
                waba_id: data?.waba_id,
                phone_number_id: data?.phone_number_id || data?.phone_id,
                restaurant_id: user?.restaurant_id // Explicitly send restaurant_id
            })
        })
            .then(resp => resp.json())
            .then(result => {
                if (result.success) {
                    setWhatsappStatus({
                        type: 'success',
                        message: `Successfully connected! Phone: ${result.data.phone_number || 'Connected'}`
                    });
                    fetchStatus();
                } else {
                    setWhatsappStatus({
                        type: 'error',
                        message: result.message || result.error || 'Failed to connect. Please try again.'
                    });
                }
            })
            .catch(error => {
                console.error('Backend connection error:', error);
                setWhatsappStatus({
                    type: 'error',
                    message: 'Failed to save connection. Please try again.'
                });
            });
    };

    const fetchStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            // Fetch WhatsApp Status
            const waRes = await fetch(`${apiUrl}/whatsapp/status`, { headers });
            const waData = await waRes.json();
            if (waData.success) {
                setConnectionData(prev => ({
                    ...prev,
                    whatsapp: { connected: waData.connected, data: waData.data }
                }));
            }

            // Fetch Facebook Status
            const fbRes = await fetch(`${apiUrl}/facebook/status`, { headers });
            const fbData = await fbRes.json();
            if (fbData.success) {
                setConnectionData(prev => ({
                    ...prev,
                    facebook: { connected: fbData.connected, data: fbData.data }
                }));
            }
        } catch (error) {
            console.error('Error fetching connection status:', error);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    useEffect(() => {
        // Load Facebook SDK
        const loadFacebookSDK = () => {
            if (window.FB) {
                setIsSDKLoaded(true);
                return;
            }

            window.fbAsyncInit = function () {
                window.FB.init({
                    appId: import.meta.env.VITE_FACEBOOK_APP_ID || '<APP_ID>',
                    autoLogAppEvents: true,
                    xfbml: true,
                    version: import.meta.env.VITE_GRAPH_API_VERSION || 'v18.0'
                });
                setIsSDKLoaded(true);
            };

            // Load SDK script
            const script = document.createElement('script');
            script.src = 'https://connect.facebook.net/en_US/sdk.js';
            script.async = true;
            script.defer = true;
            script.crossOrigin = 'anonymous';
            document.body.appendChild(script);
        };

        loadFacebookSDK();

        // Session logging message event listener for WhatsApp Embedded Signup
        const handleMessage = (event) => {
            if (event.origin !== 'https://www.facebook.com' && !event.origin.endsWith('facebook.com')) return;

            try {
                const data = JSON.parse(event.data);
                if (data.type === 'WA_EMBEDDED_SIGNUP') {
                    if (data.event === 'CANCEL') {
                        setWhatsappStatus({
                            type: 'error',
                            message: data.data?.current_step
                                ? `Setup cancelled at step: ${data.data.current_step}`
                                : 'Setup cancelled. Please try again.'
                        });
                    } else if (data.event === 'FINISH' || data.event === 'FINISH_ONLY_WABA' || data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
                        // Store signup data
                        if (data.data) {
                            const merged = { ...signupDataRef.current, ...data.data, event_type: data.event };
                            signupDataRef.current = merged;
                            setSignupData(merged);
                            console.log('[ConnectHub] Stored signup data:', merged);
                        }

                        let message = 'WhatsApp signup completed! Finishing connection...';
                        if (data.event === 'FINISH_ONLY_WABA') {
                            message = 'WhatsApp Business Account connected (phone number setup pending).';
                        }
                        setWhatsappStatus({ type: 'success', message });

                        // If token already available, send immediately
                        if (accessTokenRef.current) {
                            sendWhatsAppToBackend();
                        }
                    } else {
                        if (data.data) {
                            const merged = { ...signupDataRef.current, ...data.data, event_type: data.event };
                            signupDataRef.current = merged;
                            setSignupData(merged);
                        }
                    }
                }
            } catch {
                // Non-JSON message - ignore silently
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
            if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
        };
    }, []);

    // WhatsApp Response callback
    const whatsappLoginCallback = (response) => {
        if (response.authResponse) {
            const accessToken = response.authResponse.accessToken;

            if (!accessToken) {
                setWhatsappStatus({
                    type: 'error',
                    message: 'Facebook login failed: No access token received. Please try again.'
                });
                return;
            }

            // Store token in ref
            accessTokenRef.current = accessToken;

            // If signup data already arrived via message event, send immediately
            if (signupDataRef.current?.waba_id || signupDataRef.current?.phone_number_id) {
                console.log('[ConnectHub] Signup data already available, sending immediately');
                sendWhatsAppToBackend();
            } else {
                // Wait up to 3s for WA_EMBEDDED_SIGNUP message, then send anyway
                console.log('[ConnectHub] Waiting up to 3s for signup data from message event...');
                setWhatsappStatus({ type: 'success', message: 'Finishing setup, please wait...' });
                sendTimerRef.current = setTimeout(() => {
                    console.log('[ConnectHub] Timeout - sending with available data');
                    sendWhatsAppToBackend();
                }, 3000);
            }
        } else {
            setWhatsappStatus({
                type: 'error',
                message: response.status === 'unknown'
                    ? 'Login cancelled or popup closed'
                    : 'Failed to connect. Please try again.'
            });
        }
    };

    // Facebook Page Response callback
    const facebookPageCallback = (response) => {
        if (response.authResponse) {
            const { accessToken } = response.authResponse;

            setFacebookStatus({
                type: 'success',
                message: 'Processing Facebook Page connection...'
            });

            // Get user's pages
            window.FB.api('/me/accounts', { access_token: accessToken }, (pagesResponse) => {
                if (pagesResponse.data && pagesResponse.data.length > 0) {
                    // For now, connect the first page (you can add page selection UI later)
                    const page = pagesResponse.data[0];

                    // Send to backend
                    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/facebook/connect`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            page_id: page.id,
                            page_name: page.name,
                            page_access_token: page.access_token
                        })
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                setFacebookStatus({
                                    type: 'success',
                                    message: `Successfully connected to page: ${page.name}`
                                });
                                fetchStatus(); // Refresh status
                            } else {
                                setFacebookStatus({
                                    type: 'error',
                                    message: data.message || 'Failed to connect Facebook Page.'
                                });
                            }
                        })
                        .catch(error => {
                            console.error('Backend connection error:', error);
                            setFacebookStatus({
                                type: 'error',
                                message: 'Failed to save Facebook Page connection.'
                            });
                        });
                } else {
                    setFacebookStatus({
                        type: 'error',
                        message: 'No Facebook Pages found. Please create a page first.'
                    });
                }
            });
        } else {
            setFacebookStatus({
                type: 'error',
                message: response.status === 'unknown'
                    ? 'Login cancelled or popup closed'
                    : 'Failed to connect. Please try again.'
            });
        }
    };

    // Launch WhatsApp signup
    const launchWhatsAppSignup = () => {
        if (!window.FB) {
            setWhatsappStatus({
                type: 'error',
                message: 'Facebook SDK not loaded. Please refresh the page.'
            });
            return;
        }

        // WhatsApp Embedded Signup
        window.FB.login(whatsappLoginCallback, {
            config_id: import.meta.env.VITE_WHATSAPP_CONFIG_ID || '<CONFIGURATION_ID>'
        });
    };

    const launchFacebookPageConnect = () => {
        if (!window.FB) {
            setFacebookStatus({
                type: 'error',
                message: 'Facebook SDK not loaded. Please refresh the page.'
            });
            return;
        }

        window.FB.login(facebookPageCallback, {
            scope: 'pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement'
        });
    };

    const handleDisconnect = async (platform) => {
        if (!window.confirm(`Are you sure you want to disconnect ${platform}?`)) return;

        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            const res = await fetch(`${apiUrl}/${platform}/disconnect`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();

            if (data.success) {
                if (platform === 'whatsapp') {
                    setWhatsappStatus({ type: 'success', message: 'WhatsApp disconnected successfully' });
                    setConnectionData(prev => ({ ...prev, whatsapp: { connected: false, data: null } }));
                } else {
                    setFacebookStatus({ type: 'success', message: 'Facebook Page disconnected successfully' });
                    setConnectionData(prev => ({ ...prev, facebook: { connected: false, data: null } }));
                }
                fetchStatus(); // Refresh status
            }
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    };

    return (
        <div className="dashboard-frame">
            <div className="frame-header">
                <h2>Connect Your Platforms</h2>
                <p className="frame-subtitle">Integrate WhatsApp and Facebook to engage with your customers</p>
            </div>

            <div className="frame-content">
                {/* Slider/Tabs */}
                <div className="connect-tabs">
                    <button
                        className={`connect-tab ${activeTab === 'whatsapp' ? 'active' : ''}`}
                        onClick={() => setActiveTab('whatsapp')}
                    >
                        <MessageCircle size={20} />
                        <span>WhatsApp Business</span>
                    </button>
                    <button
                        className={`connect-tab ${activeTab === 'facebook' ? 'active' : ''}`}
                        onClick={() => setActiveTab('facebook')}
                    >
                        <Facebook size={20} />
                        <span>Facebook Page</span>
                    </button>
                </div>

                {/* WhatsApp Connect Section */}
                {activeTab === 'whatsapp' && (
                    <div className="connect-section">
                        {connectionData.whatsapp.connected ? (
                            <div className="connected-card">
                                <div className="connected-header">
                                    <CheckCircle size={24} color="#16a34a" />
                                    <h4>Connected</h4>
                                </div>
                                <div className="connected-details">
                                    <p><strong>Phone Number:</strong> {connectionData.whatsapp.data?.phone_number || 'N/A'}</p>
                                    <p><strong>Quality Rating:</strong> {connectionData.whatsapp.data?.quality_rating || 'N/A'}</p>
                                    {connectionData.whatsapp.data?.connected_at &&
                                        <p><strong>Connected Since:</strong> {new Date(connectionData.whatsapp.data.connected_at).toLocaleDateString()}</p>
                                    }
                                </div>
                                <button
                                    onClick={() => handleDisconnect('whatsapp')}
                                    className="disconnect-btn"
                                >
                                    Disconnect WhatsApp
                                </button>
                            </div>
                        ) : (
                            <div className="connect-info-card">
                                <MessageCircle size={48} className="connect-icon" />
                                <h3>Connect Your WhatsApp Business Account</h3>
                                <p>
                                    Link your WhatsApp Business account to enable automated customer interactions,
                                    order notifications, and seamless communication with your customers.
                                </p>

                                <div className="connect-features">
                                    <div className="feature-item">
                                        <CheckCircle size={20} />
                                        <span>Automated order confirmations</span>
                                    </div>
                                    <div className="feature-item">
                                        <CheckCircle size={20} />
                                        <span>Real-time customer support</span>
                                    </div>
                                    <div className="feature-item">
                                        <CheckCircle size={20} />
                                        <span>Menu browsing via WhatsApp</span>
                                    </div>
                                    <div className="feature-item">
                                        <CheckCircle size={20} />
                                        <span>Reservation management</span>
                                    </div>
                                </div>

                                <button
                                    onClick={launchWhatsAppSignup}
                                    disabled={!isSDKLoaded}
                                    className="connect-btn whatsapp-btn"
                                >
                                    {isSDKLoaded ? 'Connect WhatsApp' : 'Loading...'}
                                </button>

                                {whatsappStatus && (
                                    <div className={`connection-status ${whatsappStatus.type}`}>
                                        {whatsappStatus.type === 'success' ? (
                                            <CheckCircle size={20} />
                                        ) : (
                                            <AlertCircle size={20} />
                                        )}
                                        <span>{whatsappStatus.message}</span>
                                    </div>
                                )}

                                <div className="connect-note">
                                    <AlertCircle size={16} />
                                    <p>
                                        You'll need a Facebook Business account and WhatsApp Business API access
                                        to complete this setup.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Facebook Page Connect Section */}
                {activeTab === 'facebook' && (
                    <div className="connect-section">
                        {connectionData.facebook.connected ? (
                            <div className="connected-card">
                                <div className="connected-header">
                                    <CheckCircle size={24} color="#16a34a" />
                                    <h4>Connected</h4>
                                </div>
                                <div className="connected-details">
                                    <p><strong>Page Name:</strong> {connectionData.facebook.data?.page_name || 'N/A'}</p>
                                    {connectionData.facebook.data?.page_id &&
                                        <p><strong>Page ID:</strong> {connectionData.facebook.data.page_id}</p>
                                    }
                                    {connectionData.facebook.data?.connected_at &&
                                        <p><strong>Connected Since:</strong> {new Date(connectionData.facebook.data.connected_at).toLocaleDateString()}</p>
                                    }
                                </div>
                                <button
                                    onClick={() => handleDisconnect('facebook')}
                                    className="disconnect-btn"
                                >
                                    Disconnect Page
                                </button>
                            </div>
                        ) : (
                            <div className="connect-info-card">
                                <Facebook size={48} className="connect-icon facebook-icon" />
                                <h3>Connect Your Facebook Page</h3>
                                <p>
                                    Link your Facebook Page to enable automated responses to messages,
                                    engage with customers, and manage your social media presence directly from your dashboard.
                                </p>

                                <div className="connect-features">
                                    <div className="feature-item">
                                        <CheckCircle size={20} />
                                        <span>Automated message responses</span>
                                    </div>
                                    <div className="feature-item">
                                        <CheckCircle size={20} />
                                        <span>Customer inquiry management</span>
                                    </div>
                                    <div className="feature-item">
                                        <CheckCircle size={20} />
                                        <span>Menu sharing on Facebook</span>
                                    </div>
                                    <div className="feature-item">
                                        <CheckCircle size={20} />
                                        <span>Unified messaging dashboard</span>
                                    </div>
                                </div>

                                <button
                                    onClick={launchFacebookPageConnect}
                                    disabled={!isSDKLoaded}
                                    className="connect-btn facebook-btn"
                                >
                                    {isSDKLoaded ? 'Connect Facebook Page' : 'Loading...'}
                                </button>

                                {facebookStatus && (
                                    <div className={`connection-status ${facebookStatus.type}`}>
                                        {facebookStatus.type === 'success' ? (
                                            <CheckCircle size={20} />
                                        ) : (
                                            <AlertCircle size={20} />
                                        )}
                                        <span>{facebookStatus.message}</span>
                                    </div>
                                )}

                                <div className="connect-note">
                                    <AlertCircle size={16} />
                                    <p>
                                        You'll need to be an admin of a Facebook Page to complete this connection.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConnectHub;
