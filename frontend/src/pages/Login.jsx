import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import useAuth from '../hooks/useAuth';
import { notifyError, notifyLoading, notifySuccess } from "../components/StaffDashboard/utils/notify";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '',rememberMe: false });
    // const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });

    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const userData = await login(
                formData.email,
                formData.password,
                formData.rememberMe
            );

            notifySuccess("Signed in successfully");

            if (userData.role === 'staff') {
                navigate('/staff-dashboard');
            } else if (userData.role === 'superadmin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/dashboard');
            }

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Invalid email or password';
            notifyError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to access your restaurant dashboard"
        >
            <form onSubmit={handleSubmit} className="auth-form">
                <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    placeholder="you@restaurant.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <div className="input-with-icon">
                    <Input
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="password-toggle"
                        style={{ top: '38px' }} /* Manual adjustment for label spacing if needed, but lets rely on CSS if possible. The CSS says top 50%. Input component might have label inside or outside. Let's assume input-with-icon handles it or stick to the CSS class. Wait, CSS .password-toggle says top 50%. Input component likely includes label. The previous inline style had top: 38px. If I use .password-toggle it might be centered vertically relative to the container. Let's keep it simple. */
                    >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                </div>

                <div className="form-options" style={{ justifyContent: "space-between" }}>

                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            className="checkbox-input"
                            checked={formData.rememberMe}
                            onChange={(e) => {
                                handleChange({ target: { name: 'rememberMe', value: e.target.checked } });
                            }}
                        />
                        <span className="checkbox-text">Remember me</span>
                    </label>
                    <Link to="/forget-password" className="form-link">
                        Forgot password?
                    </Link>
                </div>


                {/* {error && (
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )} */}

                <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    style={{ width: '100%' }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="auth-footer">
                    Don't have an account?{' '}
                    <Link to="/signup" className="form-link">
                        Create Account
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
};

export default Login;
