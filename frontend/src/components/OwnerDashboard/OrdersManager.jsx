import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useOrders } from '../StaffDashboard/hooks/useOrders';
import { getStatusColor, getStatusLabel } from '../StaffDashboard/utils/orderUtils';
import OrderDetailsPanel from '../StaffDashboard/OrderDetailsPanel';
import './OwnerDashboard.css';

const OrdersManager = () => {
    const {
        orders,
        isLoading,
        updateOrderStatus,
        fetchOrders // To refresh if needed
    } = useOrders();

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Filter logic
    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.id.toString().includes(searchTerm) ||
            (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesFilter = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesFilter;
    });

    const closeDrawer = () => setSelectedOrder(null);

    return (
        <div className="orders-manager">
            {/* Header / Controls */}
            <header className="frame-header">
                <div>
                    <h2 className="frame-title">Orders Manager</h2>
                    <p className="frame-subtitle">Manage and track live orders</p>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="orders-controls">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search by ID or customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-dropdown">
                    <Filter size={20} />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="orders-table-container">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Time</th>
                            <th>Customer</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="6" className="text-center">Loading orders...</td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan="6" className="text-center">No orders found.</td></tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className="order-row"
                                >
                                    <td className="font-mono">#{order.id}</td>
                                    <td>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td>{order.customer_name || 'Guest'}</td>
                                    <td>
                                        <span className={`badge badge-${order.service_type || 'takeaway'}`}>
                                            {order.service_type || 'Takeaway'}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className="status-badge"
                                            style={{
                                                backgroundColor: getStatusColor(order.status) + '20', // 20% opacity
                                                color: getStatusColor(order.status)
                                            }}
                                        >
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td className="font-bold">Rs. {Number(order.total_amount).toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Order Detail Drawer */}
            {selectedOrder && (
                <>
                    <div className="drawer-overlay" onClick={closeDrawer}></div>
                    <div className="order-drawer">
                        <button className="close-drawer-btn" onClick={closeDrawer}>
                            <X size={24} />
                        </button>
                        <OrderDetailsPanel
                            order={selectedOrder}
                            user={{ username: 'Owner', role: 'owner' }} // Mock user context for now
                            onStatusUpdate={updateOrderStatus}
                            onToggleSidebar={() => { }} // Not needed in drawer
                            isSidebarOpen={true} // Force visible
                            onLogout={() => { }} // Not needed in drawer
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default OrdersManager;
