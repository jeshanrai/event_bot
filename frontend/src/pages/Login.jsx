import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import useAuth from '../hooks/useAuth';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const userData = await login(formData.email, formData.password);
            if (userData.role === 'staff') {
                navigate('/staff-dashboard');
            } else if (userData.role === 'superadmin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password');
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

                <div style={{ position: 'relative' }}>
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
                        style={{
                            position: 'absolute',
                            right: '12px',
                            top: '38px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-neutral-500)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" style={{ cursor: 'pointer' }} />
                        <span>Remember me</span>
                    </label>
                </div>

                {error && (
                    <div style={{
                        padding: '12px',
                        background: 'var(--color-danger-light)',
                        color: 'var(--color-danger-dark)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        border: '1px solid rgba(220, 38, 38, 0.2)',
                        marginBottom: '1rem'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    style={{ width: '100%' }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <div style={{
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    color: 'var(--color-neutral-600)',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--color-neutral-200)'
                }}>
                    Don't have an account?{' '}
                    <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}>
                        Create Account
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
};

export default Login;
