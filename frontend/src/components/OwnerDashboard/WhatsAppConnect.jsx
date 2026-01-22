import React, { useEffect, useState } from 'react';
import { MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import './OwnerDashboard.css';

const WhatsAppConnect = () => {
    const [isSDKLoaded, setIsSDKLoaded] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);
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
                    autoLogAppEvents: false, // Disable to prevent ad blocker issues
                    xfbml: true,
                    version: import.meta.env.VITE_GRAPH_API_VERSION || 'v24.0'
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
                // Enhanced logging for debugging
                console.log('Received message from Facebook:', event.data);

                const data = JSON.parse(event.data);
                if (data.type === 'WA_EMBEDDED_SIGNUP') {
                    console.log('WhatsApp signup event found:', data);

                    // Handle different event types
                    if (data.event === 'CANCEL') {
                        // User abandoned the flow or reported an error
                        if (data.data.error_message) {
                            // User reported an error
                            console.error('User reported error:', {
                                message: data.data.error_message,
                                error_id: data.data.error_id,
                                session_id: data.data.session_id,
                                timestamp: data.data.timestamp
                            });
                            setConnectionStatus({
                                type: 'error',
                                message: `Setup error: ${data.data.error_message}. Error ID: ${data.data.error_id}`
                            });
                        } else if (data.data.current_step) {
                            // User abandoned the flow at a specific step
                            console.log('User abandoned flow at step:', data.data.current_step);
                            setConnectionStatus({
                                type: 'error',
                                message: `Setup cancelled at step: ${data.data.current_step}. Please try again.`
                            });
                        } else {
                            setConnectionStatus({
                                type: 'error',
                                message: 'Setup cancelled. Please try again.'
                            });
                        }
                    } else if (data.event === 'FINISH' || data.event === 'FINISH_ONLY_WABA' || data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
                        // Successful flow completion
                        console.log('Flow completed successfully:', data.event);
                        
                        // Store the signup data (waba_id, phone_number_id, etc)
                        if (data.data) {
                            setSignupData(prev => ({ ...prev, ...data.data, event_type: data.event }));
                        }

                        // Set appropriate success message based on event type
                        let message = 'WhatsApp connection initiated successfully!';
                        if (data.event === 'FINISH_ONLY_WABA') {
                            message = 'WhatsApp Business Account connected (phone number setup pending).';
                        } else if (data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
                            message = 'WhatsApp Business App number connected successfully!';
                        }

                        setConnectionStatus({
                            type: 'success',
                            message: message
                        });
                    } else {
                        // Unknown event type - log and store data anyway
                        console.log('Unknown event type:', data.event);
                        if (data.data) {
                            setSignupData(prev => ({ ...prev, ...data.data, event_type: data.event }));
                        }
                    }
                }
            } catch (error) {
                // Non-JSON message or parsing error
                console.log('Non-JSON message event:', event.data);
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    // Response callback - NOT async to avoid Facebook SDK error
    const fbLoginCallback = (response) => {
        console.log('=== Facebook Login Callback ===');
        console.log('Full Response:', response);
        console.log('Status:', response.status);
        console.log('Auth Response:', response.authResponse);
        
        if (response.authResponse) {
            const { code, accessToken } = response.authResponse;
            console.log('Received Code:', code ? 'Yes' : 'No');
            console.log('Received Access Token:', accessToken ? 'Yes' : 'No');
            console.log('Signup Data:', signupData);

            if (!code && !accessToken) {
                console.error('Neither Authorization code nor Access Token received');
                setConnectionStatus({
                    type: 'error',
                    message: 'Facebook login failed: No credentials received. Please try again.'
                });
                return;
            }

            setConnectionStatus({
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
                .then(response => {
                    console.log('Response status:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('Response data:', data);
                    if (data.success) {
                        setConnectionStatus({
                            type: 'success',
                            message: `Successfully connected! Phone: ${data.data.phone_number || 'Connected'}`
                        });
                    } else {
                        setConnectionStatus({
                            type: 'error',
                            message: data.message || data.error || 'Failed to connect. Please try again.'
                        });
                    }
                })
                .catch(error => {
                    console.error('Backend connection error:', error);
                    setConnectionStatus({
                        type: 'error',
                        message: 'Failed to save connection. Please try again.'
                    });
                });
        } else {
            console.warn('No auth response received');
            console.log('Response Status:', response.status);
            
            if (response.status === 'unknown') {
                setConnectionStatus({
                    type: 'error',
                    message: 'Login was cancelled or popup was closed. Please try again and complete the login process.'
                });
            } else if (response.status === 'not_authorized') {
                setConnectionStatus({
                    type: 'error',
                    message: 'You need to authorize the app to continue. Please try again.'
                });
            } else {
                setConnectionStatus({
                    type: 'error',
                    message: `Login failed (${response.status}). Please ensure your Facebook app is properly configured.`
                });
            }
        }
    };

    // Launch WhatsApp signup
    const launchWhatsAppSignup = () => {
        if (!window.FB) {
            setConnectionStatus({
                type: 'error',
                message: 'Facebook SDK not loaded. Please refresh the page.'
            });
            return;
        }

        // Check if popup blockers are preventing the window from opening
        const testPopup = window.open('', '_blank', 'width=1,height=1');
        if (!testPopup || testPopup.closed || typeof testPopup.closed == 'undefined') {
            setConnectionStatus({
                type: 'error',
                message: 'Please disable your popup blocker for this site and try again.'
            });
            return;
        }
        testPopup.close();

        // Clear any previous status
        setConnectionStatus({
            type: 'success',
            message: 'Opening Facebook login...'
        });

        // Suppress console errors from ad blockers blocking Facebook analytics
        const originalConsoleError = console.error;
        console.error = (...args) => {
            const errorString = args.join(' ');
            if (errorString.includes('impression.php') || 
                errorString.includes('ERR_BLOCKED_BY_CLIENT') ||
                errorString.includes('Failed to fetch')) {
                // Suppress ad blocker related errors - these don't affect functionality
                return;
            }
            originalConsoleError.apply(console, args);
        };

        // Restore console.error after 10 seconds
        setTimeout(() => {
            console.error = originalConsoleError;
        }, 10000);

        try {
            console.log('Launching FB.login with config:', {
                config_id: import.meta.env.VITE_WHATSAPP_CONFIG_ID,
                app_id: import.meta.env.VITE_FACEBOOK_APP_ID
            });

            window.FB.login(fbLoginCallback, {
                config_id: import.meta.env.VITE_WHATSAPP_CONFIG_ID || '<CONFIGURATION_ID>',
                response_type: 'code',
                override_default_response_type: true,
                extras: {
                    setup: {},
                }
            });
        } catch (error) {
            console.error = originalConsoleError;
            console.error('FB.login error:', error);
            setConnectionStatus({
                type: 'error',
                message: 'Failed to launch Facebook login. Please try again.'
            });
        }
    };

    return (
        <div className="dashboard-frame">
            <div className="frame-header">
                <h2>
                    <MessageCircle size={24} />
                    WhatsApp Business Connection
                </h2>
            </div>

            <div className="frame-content">
                <div className="whatsapp-connect-container">
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
                        </div> If you're using an ad blocker, you may need to
                                disable it temporarily for this page.

                        <button
                            onClick={launchWhatsAppSignup}
                            disabled={!isSDKLoaded}
                            className="whatsapp-connect-btn"
                        >
                            {isSDKLoaded ? 'Connect with Facebook' : 'Loading...'}
                        </button>

                        {connectionStatus && (
                            <div className={`connection-status ${connectionStatus.type}`}>
                                {connectionStatus.type === 'success' ? (
                                    <CheckCircle size={20} />
                                ) : (
                                    <AlertCircle size={20} />
                                )}
                                <span>{connectionStatus.message}</span>
                            </div>
                        )}

                        <div className="connect-note">
                            <AlertCircle size={16} />
                            <p>
                                Requirements: Facebook Business account and WhatsApp Business API access.
                                <br />
                                <strong>Important:</strong> Please disable popup blockers and allow popups for this site.
                                Ad blockers may show harmless errors but won't prevent the connection.
                            </p>
                        </div>
                    </div>

                    <div className="setup-instructions">
                        <h4>Setup Instructions</h4>
                        <ol>
                            <li>Click the "Connect with Facebook" button above</li>
                            <li>Log in to your Facebook Business account</li>
                            <li>Select or create a WhatsApp Business account</li>
                            <li>Grant necessary permissions</li>
                            <li>Complete the verification process</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppConnect;
