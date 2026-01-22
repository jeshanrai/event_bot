import React, { useState, useEffect } from 'react';
import { Eye, Search, Filter, Download, Loader, AlertCircle, TrendingUp } from 'lucide-react';
import superAdminAPI from '../../services/superAdminApi';

const OrdersManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [platformFilter, setPlatformFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, [searchTerm, statusFilter, platformFilter, page]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await superAdminAPI.getAllOrders({
                search: searchTerm || undefined,
                status: statusFilter || undefined,
                platform: platformFilter || undefined,
                page,
                limit: 15
            });

            setOrders(res.data.orders);
            setTotalPages(res.data.pages);
            setError(null);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetails = async (orderId) => {
        try {
            const res = await superAdminAPI.getOrderDetails(orderId);
            setOrderDetails(res.data);
        } catch (err) {
            console.error('Error fetching order details:', err);
        }
    };

    const handleViewDetails = async (order) => {
        setSelectedOrder(order);
        await fetchOrderDetails(order.id);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'completed': { bg: '#dcfce7', text: '#166534' },
            'pending': { bg: '#fef3c7', text: '#92400e' },
            'preparing': { bg: '#dbeafe', text: '#0c4a6e' },
            'confirmed': { bg: '#e0e7ff', text: '#4f46e5' },
            'created': { bg: '#f3f4f6', text: '#374151' },
            'rejected': { bg: '#fee2e2', text: '#991b1b' },
            'cancelled': { bg: '#f3e8ff', text: '#6b21a8' }
        };

        const config = statusConfig[status] || { bg: '#f1f5f9', text: '#64748b' };
        return (
            <span style={{
                background: config.bg,
                color: config.text,
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'capitalize'
            }}>
                {status}
            </span>
        );
    };

    const getPlatformIcon = (platform) => {
        const icons = {
            'whatsapp': '💬',
            'messenger': '📱',
            'web': '🌐'
        };
        return icons[platform] || '📌';
    };

    const handleUpdateStatus = async (orderId, newStatus, reason) => {
        try {
            await superAdminAPI.updateOrderStatus(orderId, {
                status: newStatus,
                rejectionReason: reason
            });
            await fetchOrders();
            setSelectedOrder(null);
            setOrderDetails(null);
        } catch (err) {
            console.error('Error updating order:', err);
            setError('Failed to update order');
        }
    };

    const handleExport = () => {
        const csv = [
            ['Order ID', 'Customer', 'Phone', 'Platform', 'Amount', 'Status', 'Date'],
            ...orders.map(o => [
                o.id,
                o.customer_name,
                o.customer_phone,
                o.platform,
                o.total_amount,
                o.status,
                new Date(o.created_at).toLocaleString()
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="sa-orders-manager" style={{ padding: '20px' }}>
            <div className="sa-header">
                <h1 className="sa-title">Orders Manager</h1>
                <p className="sa-subtitle">View and manage all orders across the platform</p>
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
                                placeholder="Search by customer name, phone..."
                                className="sa-search"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                style={{ paddingLeft: '40px', maxWidth: '100%' }}
                            />
                        </div>
                        <select
                            className="sa-search"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            style={{ width: '150px' }}
                        >
                            <option value="">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="preparing">Preparing</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <select
                            className="sa-search"
                            value={platformFilter}
                            onChange={(e) => {
                                setPlatformFilter(e.target.value);
                                setPage(1);
                            }}
                            style={{ width: '150px' }}
                        >
                            <option value="">All Platforms</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="messenger">Messenger</option>
                            <option value="web">Web</option>
                        </select>
                        <button
                            className="sa-btn-primary"
                            onClick={handleExport}
                            style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        <Loader size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                        Loading orders...
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        No orders found
                    </div>
                ) : (
                    <>
                        <table className="sa-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Platform</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Service Type</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td style={{ fontWeight: '600', color: '#4f46e5' }}>#{order.id}</td>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#0f172a' }}>
                                                    {order.customer_name || 'Anonymous'}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                                                    {order.customer_phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '18px' }}>
                                                {getPlatformIcon(order.platform)} {order.platform}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: '600', color: '#0f172a' }}>
                                            ₨{order.total_amount?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                        </td>
                                        <td>{getStatusBadge(order.status)}</td>
                                        <td style={{ textTransform: 'capitalize', color: '#64748b' }}>
                                            {(order.service_type || 'N/A').replace(/_/g, ' ')}
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: '14px' }}>
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <button
                                                className="sa-action-btn sa-btn-view"
                                                title="View Details"
                                                onClick={() => handleViewDetails(order)}
                                            >
                                                <Eye size={16} />
                                            </button>
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
                            padding: '20px',
                            borderTop: '1px solid #e2e8f0'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '14px' }}>
                                Page {page} of {totalPages} ({orders.length} orders)
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

            {/* Order Details Modal */}
            {selectedOrder && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}>
                        <div style={{ padding: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ color: '#0f172a', margin: 0 }}>Order #{selectedOrder.id}</h2>
                                <button
                                    onClick={() => {
                                        setSelectedOrder(null);
                                        setOrderDetails(null);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        color: '#64748b'
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                                        Customer
                                    </label>
                                    <p style={{ color: '#0f172a', margin: '5px 0 0' }}>
                                        {selectedOrder.customer_name || 'Anonymous'}
                                    </p>
                                </div>
                                <div>
                                    <label style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                                        Phone
                                    </label>
                                    <p style={{ color: '#0f172a', margin: '5px 0 0' }}>
                                        {selectedOrder.customer_phone}
                                    </p>
                                </div>
                                <div>
                                    <label style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                                        Amount
                                    </label>
                                    <p style={{ color: '#0f172a', margin: '5px 0 0', fontSize: '18px', fontWeight: '600' }}>
                                        ₨{selectedOrder.total_amount?.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <label style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                                        Status
                                    </label>
                                    <div style={{ margin: '5px 0 0' }}>
                                        {getStatusBadge(selectedOrder.status)}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                                        Platform
                                    </label>
                                    <p style={{ color: '#0f172a', margin: '5px 0 0', textTransform: 'capitalize' }}>
                                        {getPlatformIcon(selectedOrder.platform)} {selectedOrder.platform}
                                    </p>
                                </div>
                                <div>
                                    <label style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                                        Service Type
                                    </label>
                                    <p style={{ color: '#0f172a', margin: '5px 0 0', textTransform: 'capitalize' }}>
                                        {(selectedOrder.service_type || 'N/A').replace(/_/g, ' ')}
                                    </p>
                                </div>
                            </div>

                            {orderDetails?.items && orderDetails.items.length > 0 && (
                                <div style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <h4 style={{ color: '#0f172a', marginTop: 0 }}>Order Items</h4>
                                    {orderDetails.items.map((item, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '8px 0',
                                            borderBottom: idx < orderDetails.items.length - 1 ? '1px solid #e2e8f0' : 'none'
                                        }}>
                                            <span style={{ color: '#0f172a' }}>
                                                {item.name} x{item.quantity}
                                            </span>
                                            <span style={{ fontWeight: '600', color: '#0f172a' }}>
                                                ₨{(item.unit_price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedOrder.special_instructions && (
                                <div style={{ marginBottom: '20px', padding: '12px', background: '#fef3c7', borderRadius: '6px', borderLeft: '4px solid #f59e0b' }}>
                                    <strong style={{ color: '#92400e' }}>Special Instructions:</strong>
                                    <p style={{ color: '#92400e', margin: '5px 0 0', fontSize: '14px' }}>
                                        {selectedOrder.special_instructions}
                                    </p>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                                <button
                                    className="sa-btn-primary"
                                    onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                                    style={{ background: '#10b981' }}
                                >
                                    Mark Completed
                                </button>
                                <button
                                    className="sa-btn-primary"
                                    onClick={() => handleUpdateStatus(selectedOrder.id, 'rejected')}
                                    style={{ background: '#dc2626' }}
                                >
                                    Reject
                                </button>
                                <button
                                    className="sa-btn-primary"
                                    onClick={() => {
                                        setSelectedOrder(null);
                                        setOrderDetails(null);
                                    }}
                                    style={{ background: '#94a3b8' }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersManager;
