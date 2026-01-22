import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';

/**
 * Custom hook for managing orders state and operations
 */
export const useOrders = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchOrders = useCallback(async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) setIsRefreshing(true);

        try {
            const { data } = await api.get('/orders/pending');

            const newOrdersCount = data.filter(order => order.status === 'pending').length;
            setUnreadCount(newOrdersCount);

            setOrders(data);

            if (!selectedOrder && data.length > 0) {
                setSelectedOrder(data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch pending orders:', error);
        } finally {
            setIsLoading(false);
            if (showRefreshIndicator) {
                setTimeout(() => setIsRefreshing(false), 500);
            }
        }
    }, [selectedOrder]);

    const updateOrderStatus = async (orderId, newStatus) => {
        // Optimistic update
        const previousOrders = [...orders];
        const previousSelected = selectedOrder;

        // Update local state immediately
        setOrders(prevOrders => prevOrders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
        ));

        if (selectedOrder?.id === orderId) {
            setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }

        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            // We can still fetch in background to ensure consistency, 
            // but the user sees the change instantly.
            fetchOrders();

            if (selectedOrder?.id === orderId && ['delivered', 'cancelled'].includes(newStatus)) {
                // Logic for removing/changing selection if needed
                // For now, let's keep it visible or handle as before
            }
        } catch (error) {
            console.error('Failed to update order status:', error);
            // Revert changes
            setOrders(previousOrders);
            setSelectedOrder(previousSelected);
            throw error;
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(() => fetchOrders(), 10000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    return {
        orders,
        selectedOrder,
        isLoading,
        isRefreshing,
        unreadCount,
        fetchOrders,
        updateOrderStatus,
        setSelectedOrder
    };
};
