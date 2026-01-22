export const filterOrders = (orders, filter) => {
    if (!orders) return [];

    switch (filter) {
        case 'dinein':
            return orders.filter(order =>
                order.service_type === 'dine-in' ||
                order.service_type === 'dinein' ||
                order.service_type === 'dine_in'
            );
        case 'delivery':
            return orders.filter(order =>
                order.service_type === 'delivery'
            );
        case 'all':
        default:
            // Return all orders without any filtering
            return orders;
    }
};

export const getStatusColor = (status) => {
    const statusColors = {
        pending: '#FF9800',
        accepted: '#2196F3',
        preparing: '#9C27B0',
        ready: '#4CAF50',
        delivered: '#607D8B',
        cancelled: '#F44336'
    };
    return statusColors[status] || '#757575';
};

export const getStatusLabel = (status) => {
    const statusLabels = {
        pending: 'Pending',
        accepted: 'Accepted',
        preparing: 'Preparing',
        ready: 'Ready',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
    };
    return statusLabels[status] || status;
};

export const getProgressInfo = (status) => {
    const progressMap = {
        pending: { current: 1, total: 4 },
        accepted: { current: 1, total: 4 },
        preparing: { current: 2, total: 4 },
        ready: { current: 3, total: 4 },
        delivered: { current: 4, total: 4 },
        cancelled: { current: 0, total: 4 }
    };
    return progressMap[status] || { current: 0, total: 4 };
};

export const getActionButtonConfig = (status) => {
    const configs = {
        pending: {
            label: 'Accept Order',
            nextStatus: 'accepted',
            color: '#4CAF50'
        },
        accepted: {
            label: 'Start Preparing',
            nextStatus: 'preparing',
            color: '#2196F3'
        },
        preparing: {
            label: 'Mark Ready',
            nextStatus: 'ready',
            color: '#FF9800'
        },
        ready: {
            label: 'Mark Delivered',
            nextStatus: 'delivered',
            color: '#9C27B0'
        }
    };
    return configs[status] || null;
};

export const getAllStatuses = () => {
    return [
        { value: 'pending', label: 'Pending', color: '#FF9800' },
        { value: 'accepted', label: 'Accepted', color: '#2196F3' },
        { value: 'preparing', label: 'Preparing', color: '#9C27B0' },
        { value: 'ready', label: 'Ready', color: '#4CAF50' },
        { value: 'delivered', label: 'Delivered', color: '#607D8B' },
        { value: 'cancelled', label: 'Cancelled', color: '#F44336' }
    ];
};
