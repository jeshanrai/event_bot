import React, { useState, useEffect } from 'react';
import { MoreVertical, ExternalLink, Ban, ArrowUpCircle, Search, Loader, AlertCircle, Trash2 } from 'lucide-react';
import superAdminAPI from '../../services/superAdminApi';

const RestaurantsList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('restaurant_owner');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionModal, setActionModal] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [searchTerm, roleFilter, page]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await superAdminAPI.getAllUsers({
                role: roleFilter,
                search: searchTerm || undefined,
                page,
                limit: 10
            });

            setUsers(res.data.users);
            setTotalPages(res.data.pages);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (user, action) => {
        setSelectedUser(user);
        setActionModal(action);
    };

    const handleStatusChange = async (action) => {
        try {
            if (action === 'delete') {
                // Call delete API (if available)
                console.log('Deleting user:', selectedUser.id);
            }
            setActionModal(null);
            setSelectedUser(null);
            await fetchUsers();
        } catch (err) {
            console.error('Error performing action:', err);
            setError('Failed to perform action');
        }
    };

    const getInitials = (username) => {
        return username
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleBadge = (role) => {
        const badges = {
            'restaurant_owner': { bg: '#dbeafe', text: '#0c4a6e', label: 'Restaurant Owner' },
            'staff': { bg: '#f3e8ff', text: '#6b21a8', label: 'Staff' },
            'superadmin': { bg: '#fee2e2', text: '#991b1b', label: 'Super Admin' }
        };
        const badge = badges[role] || { bg: '#f1f5f9', text: '#64748b', label: role };
        return (
            <span style={{
                background: badge.bg,
                color: badge.text,
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500'
            }}>
                {badge.label}
            </span>
        );
    };

    return (
        <div className="sa-restaurants-list">
            <div className="sa-header">
                <h1 className="sa-title">Users Management</h1>
                <p className="sa-subtitle">Manage all registered users and their accounts</p>
            </div>

            <div className="sa-table-wrapper">
                <div className="sa-controls">
                    <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={16} style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8'
                            }} />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="sa-search"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                        <select
                            className="sa-search"
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setPage(1);
                            }}
                            style={{ width: '180px' }}
                        >
                            <option value="restaurant_owner">Restaurant Owners</option>
                            <option value="staff">Staff Members</option>
                            <option value="superadmin">Super Admins</option>
                        </select>
                    </div>
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

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        <Loader size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                        Loading users...
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        No users found matching your criteria
                    </div>
                ) : (
                    <>
                        <table className="sa-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Joined Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    background: '#4f46e5',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: '600',
                                                    fontSize: '14px'
                                                }}>
                                                    {getInitials(user.username)}
                                                </div>
                                                <span style={{ fontWeight: '600', color: '#0f172a' }}>
                                                    {user.username}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: '14px' }}>{user.email}</td>
                                        <td>{getRoleBadge(user.role)}</td>
                                        <td style={{ color: '#64748b', fontSize: '14px' }}>
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className="sa-btn-group">
                                                <button
                                                    className="sa-action-btn sa-btn-view"
                                                    title="View Details"
                                                    onClick={() => handleAction(user, 'view')}
                                                >
                                                    <ExternalLink size={16} />
                                                </button>
                                                <button
                                                    className="sa-action-btn sa-btn-edit"
                                                    title="Edit User"
                                                    onClick={() => handleAction(user, 'edit')}
                                                >
                                                    <ArrowUpCircle size={16} />
                                                </button>
                                                <button
                                                    className="sa-action-btn sa-btn-danger"
                                                    title="Delete User"
                                                    onClick={() => handleAction(user, 'delete')}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px 0',
                            borderTop: '1px solid #e2e8f0'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '14px' }}>
                                Page {page} of {totalPages}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    className="sa-btn-primary"
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    style={{
                                        opacity: page === 1 ? 0.5 : 1,
                                        cursor: page === 1 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Previous
                                </button>
                                <button
                                    className="sa-btn-primary"
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    style={{
                                        opacity: page === totalPages ? 0.5 : 1,
                                        cursor: page === totalPages ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Action Modal */}
            {actionModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '30px',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        {actionModal === 'delete' && (
                            <>
                                <h2 style={{ color: '#0f172a', marginBottom: '10px' }}>Delete User?</h2>
                                <p style={{ color: '#64748b', marginBottom: '20px' }}>
                                    Are you sure you want to delete <strong>{selectedUser?.username}</strong>? This action cannot be undone.
                                </p>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        className="sa-btn-primary"
                                        style={{ background: '#f1f5f9', color: '#0f172a' }}
                                        onClick={() => setActionModal(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="sa-btn-primary"
                                        style={{ background: '#dc2626', color: 'white' }}
                                        onClick={() => handleStatusChange('delete')}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                        {actionModal === 'view' && (
                            <>
                                <h2 style={{ color: '#0f172a', marginBottom: '20px' }}>User Details</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <label style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Username</label>
                                        <p style={{ color: '#0f172a', marginTop: '5px' }}>{selectedUser?.username}</p>
                                    </div>
                                    <div>
                                        <label style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Email</label>
                                        <p style={{ color: '#0f172a', marginTop: '5px' }}>{selectedUser?.email}</p>
                                    </div>
                                    <div>
                                        <label style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Role</label>
                                        <p style={{ color: '#0f172a', marginTop: '5px' }}>
                                            {getRoleBadge(selectedUser?.role)}
                                        </p>
                                    </div>
                                    <div>
                                        <label style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Joined</label>
                                        <p style={{ color: '#0f172a', marginTop: '5px' }}>
                                            {new Date(selectedUser?.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="sa-btn-primary"
                                    onClick={() => setActionModal(null)}
                                    style={{ width: '100%', marginTop: '20px' }}
                                >
                                    Close
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantsList;
