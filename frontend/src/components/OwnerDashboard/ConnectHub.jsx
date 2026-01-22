import React, { useEffect, useState } from 'react';
import { MessageCircle, CheckCircle, AlertCircle, Facebook } from 'lucide-react';
import './OwnerDashboard.css';

const ConnectHub = () => {
    const [activeTab, setActiveTab] = useState('whatsapp');
    const [isSDKLoaded, setIsSDKLoaded] = useState(false);
    const [whatsappStatus, setWhatsappStatus] = useState(null);
    const [facebookStatus, setFacebookStatus] = useState(null);
    const [signupData, setSignupData] = useState(null);

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

        // Session logging message event listener
        const handleMessage = (event) => {
            if (!event.origin.endsWith('facebook.com')) return;
            try {
                console.log('Received message from Facebook:', event.data);

                const data = JSON.parse(event.data);
                if (data.type === 'WA_EMBEDDED_SIGNUP') {
                    console.log('WhatsApp signup event found:', data);

                    if (data.data) {
                        setSignupData(prev => ({ ...prev, ...data.data }));
                    }

                    setWhatsappStatus({
                        type: 'success',
                        message: 'WhatsApp connection initiated successfully!'
                    });
                }
            } catch {
                // Ignore non-JSON messages
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    // WhatsApp Response callback
    const whatsappLoginCallback = (response) => {
        if (response.authResponse) {
            const { code, accessToken } = response.authResponse;
            console.log('WhatsApp Login Response:', response);
            console.log('Signup Data:', signupData);

            if (!code && !accessToken) {
                console.error('Neither Authorization code nor Access Token received');
                setWhatsappStatus({
                    type: 'error',
                    message: 'Facebook login failed: No credentials received. Please try again.'
                });
                return;
            }

            setWhatsappStatus({
                type: 'success',
                message: 'Processing connection...'
            });

            // Send code or token to backend
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/whatsapp/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    code,
                    access_token: accessToken,
                    waba_id: signupData?.waba_id,
                    phone_number_id: signupData?.phone_number_id || signupData?.phone_id
                })
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Response data:', data);
                    if (data.success) {
                        setWhatsappStatus({
                            type: 'success',
                            message: `Successfully connected! Phone: ${data.data.phone_number || 'Connected'}`
                        });
                    } else {
                        setWhatsappStatus({
                            type: 'error',
                            message: data.message || data.error || 'Failed to connect. Please try again.'
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
        } else {
            console.log('Login response:', response);
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
            console.log('Facebook Page Login Response:', response);

            setFacebookStatus({
                type: 'success',
                message: 'Processing Facebook Page connection...'
            });

            // Get user's pages
            window.FB.api('/me/accounts', { access_token: accessToken }, (pagesResponse) => {
                console.log('Pages Response:', pagesResponse);

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

        window.FB.login(whatsappLoginCallback, {
            config_id: import.meta.env.VITE_WHATSAPP_CONFIG_ID || '<CONFIGURATION_ID>',
            response_type: 'code',
            override_default_response_type: true,
            extras: {
                setup: {},
            }
        });
    };

    // Launch Facebook Page connection
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

                        <div className="setup-instructions">
                            <h4>Setup Instructions</h4>
                            <ol>
                                <li>Click the "Connect WhatsApp" button above</li>
                                <li>Log in to your Facebook Business account</li>
                                <li>Select or create a WhatsApp Business account</li>
                                <li>Grant necessary permissions</li>
                                <li>Complete the verification process</li>
                            </ol>
                        </div>
                    </div>
                )}

                {/* Facebook Page Connect Section */}
                {activeTab === 'facebook' && (
                    <div className="connect-section">
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

                        <div className="setup-instructions">
                            <h4>Setup Instructions</h4>
                            <ol>
                                <li>Click the "Connect Facebook Page" button above</li>
                                <li>Log in to your Facebook account</li>
                                <li>Select the page you want to connect</li>
                                <li>Grant necessary permissions for messaging</li>
                                <li>Complete the connection process</li>
                            </ol>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConnectHub;
