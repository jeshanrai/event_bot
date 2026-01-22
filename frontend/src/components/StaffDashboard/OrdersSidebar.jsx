import React from 'react';
import { Clock, Menu } from 'lucide-react';
import { getStatusColor, getStatusLabel, filterOrders } from './utils/orderUtils';
import './OrdersSidebar.css';

const OrdersSidebar = ({
    orders,
    allOrders,
    selectedOrder,
    activeFilter,
    isLoading,
    onSelectOrder,
    onFilterChange,
    onRefresh,
    onLogout,
    onToggleSidebar
}) => {

    const allCount = allOrders ? allOrders.length : 0;
    const dineInCount = allOrders ? filterOrders(allOrders, 'dinein').length : 0;
    const deliveryCount = allOrders ? filterOrders(allOrders, 'delivery').length : 0;

    return (
        <aside className="orders-sidebar">
            <div className="sidebar-header">
                <h2>Task list</h2>
                <button className="menu-icon-btn" onClick={onToggleSidebar} title="Close sidebar">
                    <Menu size={24} />
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => onFilterChange('all')}
                >
                    All ({allCount})
                </button>
                <button
                    className={`filter-tab ${activeFilter === 'dinein' ? 'active' : ''}`}
                    onClick={() => onFilterChange('dinein')}
                >
                    Dine-in ({dineInCount})
                </button>
                <button
                    className={`filter-tab ${activeFilter === 'delivery' ? 'active' : ''}`}
                    onClick={() => onFilterChange('delivery')}
                >
                    Delivery ({deliveryCount})
                </button>
            </div>

            {/* Orders List */}
            <div className="orders-scroll">
                {isLoading ? (
                    <div className="empty-state">Loading...</div>
                ) : orders.length === 0 ? (
                    <div className="empty-state">
                        <p>No tasks found</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div
                            key={order.id}
                            className={`order-card ${selectedOrder?.id === order.id ? 'active' : ''}`}
                            onClick={() => onSelectOrder(order)}
                        >
                            <div className="order-card-row">
                                <span className="order-task-id">Task #{String(order.id).padStart(5, '0')}</span>
                                <span className="order-price">Rs. {order.total_amount}</span>
                            </div>
                            <div className="order-time-row">
                                <Clock size={14} className="time-icon" />
                                <span>
                                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="order-card-footer">
                                {order.customer_name ? (
                                    <div className="order-customer-name">
                                        {order.customer_name}
                                    </div>
                                ) : (
                                    <span></span> /* Spacer if no name */
                                )}
                                <div
                                    className="order-card-status"
                                    style={{
                                        color: getStatusColor(order.status),
                                        borderColor: getStatusColor(order.status)
                                    }}
                                >
                                    {getStatusLabel(order.status)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Promo card removed as per user request */}
        </aside>
    );
};

export default OrdersSidebar;
