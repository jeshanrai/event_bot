import React, { useState } from 'react';
import { UserPlus, Users, Mail, Lock, Shield } from 'lucide-react';
import api from '../../services/api';
import './OwnerDashboard.css';

const StaffManager = () => {
    const [staffForm, setStaffForm] = useState({ username: '', email: '', password: '' });
    const [staffMessage, setStaffMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [staffList, setStaffList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch staff from API
    const fetchStaff = async () => {
        try {
            const response = await api.get('/restaurant/staff');
            setStaffList(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching staff:', error);
            setIsLoading(false);
        }
    };

    // Load staff on mount
    React.useEffect(() => {
        fetchStaff();
    }, []);

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/auth/register-staff', staffForm);
            setStaffMessage('Staff member created successfully!');
            // Refresh list from API to get the new staff member with correct ID and details
            await fetchStaff();
            setStaffForm({ username: '', email: '', password: '' });

            setTimeout(() => setStaffMessage(''), 3000);
        } catch (error) {
            setStaffMessage('Error creating staff: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="staff-manager">
            <header className="frame-header">
                <div>
                    <h2 className="frame-title">Staff Management</h2>
                    <p className="frame-subtitle">Manage access and permissions</p>
                </div>
            </header>

            <div className="staff-content-grid">

                {/* Create New Staff Form */}
                <div className="staff-card create-card">
                    <div className="card-header">
                        <h3><UserPlus size={20} /> Add New Staff</h3>
                    </div>

                    <form onSubmit={handleCreateStaff} className="staff-form">
                        <div className="form-group">
                            <label>Username</label>
                            <div className="input-icon-wrapper">
                                <Users size={16} />
                                <input
                                    type="text"
                                    value={staffForm.username}
                                    onChange={e => setStaffForm({ ...staffForm, username: e.target.value })}
                                    placeholder="johndoe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-icon-wrapper">
                                <Mail size={16} />
                                <input
                                    type="email"
                                    value={staffForm.email}
                                    onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                                    placeholder="john@restaurant.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-icon-wrapper">
                                <Lock size={16} />
                                <input
                                    type="password"
                                    value={staffForm.password}
                                    onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="primary-btn full-width" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Account'}
                        </button>

                        {staffMessage && (
                            <div className={`form-message ${staffMessage.includes('Error') ? 'error' : 'success'}`}>
                                {staffMessage}
                            </div>
                        )}
                    </form>
                </div>

                {/* Staff List */}
                <div className="staff-card list-card">
                    <div className="card-header">
                        <h3><Users size={20} /> Active Staff</h3>
                        <span className="badge">{staffList.length} Active</span>
                    </div>

                    <div className="staff-list">
                        {isLoading ? (
                            <div className="loading-state">Loading staff members...</div>
                        ) : staffList.length === 0 ? (
                            <div className="empty-state">No staff members found. Add one above!</div>
                        ) : (
                            staffList.map(member => (
                                <div key={member.id} className="staff-item">
                                    <div className="staff-avatar">
                                        {member.username[0].toUpperCase()}
                                    </div>
                                    <div className="staff-info">
                                        <div className="staff-name">{member.username}</div>
                                        <div className="staff-email">{member.email}</div>
                                    </div>
                                    <div className="staff-role">
                                        <Shield size={12} />
                                        <span>{member.role}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StaffManager;
