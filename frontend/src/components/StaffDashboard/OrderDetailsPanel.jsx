import React, { useState } from 'react';
import { ShoppingBag, Menu, ChevronDown, Printer } from 'lucide-react';
import OrderProgressSection from './OrderProgressSection';
import PrintableOrder from './PrintableOrder';
import OrderInfoCard from './OrderInfoCard';
import OrderItemsList from './OrderItemsList';
import { getActionButtonConfig, getStatusColor, getStatusLabel, getAllStatuses } from './utils/orderUtils';
import ConfirmationModal from '../common/ConfirmationModal';
import './OrderDetailsPanel.css';

const OrderDetailsPanel = ({ order, user, onStatusUpdate, onLogout, onToggleSidebar, isSidebarOpen }) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    // Confirmation States
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    if (!order) {
        return (
            <div className="empty-details">
                <ShoppingBag size={64} />
                <p>Select an order to view details</p>
            </div>
        );
    }

    const actionConfig = getActionButtonConfig(order.status);

    // Filter status updates to catch "Cancelled"
    const handleStatusUpdateClick = (newStatus) => {
        if (newStatus === 'cancelled') {
            setIsCancelModalOpen(true);
            setDropdownOpen(false); // Close dropdown
        } else {
            handleStatusUpdate(newStatus);
            setDropdownOpen(false);
        }
    };

    const confirmCancelOrder = async () => {
        setIsCancelModalOpen(false);
        await handleStatusUpdate('cancelled');
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            await onStatusUpdate(order.id, newStatus);
        } catch (error) {
            alert('Failed to update order status');
        }
    };

    // Print Handlers
    const handlePrintClick = () => setIsPrintModalOpen(true);

    const confirmPrint = () => {
        setIsPrintModalOpen(false);
        setTimeout(() => window.print(), 100); // Slight delay to ensure modal closes visually
    };

    return (
        <div className="details-container">

            <div className={`fixed-content-header ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>

                {!isSidebarOpen && (
                    <button className="toggle-sidebar-btn" onClick={onToggleSidebar} title="Open sidebar">
                        <Menu size={24} />
                    </button>
                )}


                <OrderProgressSection
                    status={order.status}
                    username={user?.username}
                    onLogout={onLogout}
                />


                <div className="section-title">Task info</div>
                <div className="divider-line"></div>


                <OrderInfoCard order={order} />
            </div>


            <div className="scrollable-items-list">

                <OrderItemsList
                    items={order.items}
                    totalAmount={order.total_amount}
                    specialInstructions={order.special_instructions}
                />




                <div className="print-section-hidden">
                    <PrintableOrder order={order} />
                </div>
            </div>


            <div className="action-footer">

                <div className="order-summary-footer">
                    <div className="summary-line total">
                        <span>Total:</span>
                        <span>Rs. {Number(order.total_amount || 0).toFixed(2)}</span>
                    </div>
                </div>

                <div className="footer-buttons">
                    <div className="status-dropdown-container">
                        <button
                            className="primary-action-btn dropdown-toggle"
                            style={{ background: getStatusColor(order.status) }}
                            onClick={() => setDropdownOpen(!isDropdownOpen)}
                        >
                            <span>{getStatusLabel(order.status)}</span>
                            <ChevronDown size={20} className={`dropdown-icon ${isDropdownOpen ? 'open' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="status-dropdown-menu">
                                {getAllStatuses().map((status) => (
                                    <button
                                        key={status.value}
                                        className={`status-option ${order.status === status.value ? 'active' : ''}`}
                                        onClick={() => handleStatusUpdateClick(status.value)}
                                    >
                                        <div className="status-dot" style={{ background: status.color }}></div>
                                        <span>{status.label}</span>
                                        {order.status === status.value && <span className="current-indicator">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className="primary-action-btn print-action-btn" onClick={handlePrintClick}>
                        <Printer size={20} />
                        <span>Print</span>
                    </button>
                </div>
            </div>

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                onConfirm={confirmPrint}
                title="Print Receipt"
                message="Are you sure you want to print this order receipt?"
                confirmText="Print"
            />

            <ConfirmationModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={confirmCancelOrder}
                title="Cancel Order"
                message="Are you sure you want to cancel this order? This action cannot be undone."
                confirmText="Cancel Order"
                isDestructive={true}
            />
        </div>
    );
};

export default OrderDetailsPanel;
