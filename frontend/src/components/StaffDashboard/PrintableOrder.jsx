import React from 'react';
import { createPortal } from 'react-dom';
import './PrintableOrder.css';

const PrintableOrder = ({ order }) => {
    if (!order) return null;

    const subtotal = order.items.reduce((sum, item) => sum + (Number(item.unit_price) * item.quantity), 0);
    // Assuming if total_amount > subtotal, the rest is tax/delivery. 
    // If total_amount isn't set, use subtotal.
    const total = Number(order.total_amount) || subtotal;
    const additionalCharges = total - subtotal;

    const content = (
        <div className="printable-receipt">
            <div className="receipt-header">
                <h1>RESTAURANT NAME</h1>
                <p>Kathmandu, Nepal</p>
                <p>Tel: +977-9800000000</p>
                <div className="receipt-divider">--------------------------------</div>
            </div>

            <div className="receipt-details">
                <div className="detail-row">
                    <span>Order #: {order.id}</span>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                    <span>Customer: {order.customer_name || 'Guest'}</span>
                </div>
                {order.customer_phone && (
                    <div className="detail-row">
                        <span>Phone: {order.customer_phone}</span>
                    </div>
                )}
                <div className="detail-row">
                    <span>Type: {order.service_type || 'Takeaway'}</span>
                </div>
                <div className="receipt-divider">--------------------------------</div>
            </div>

            <div className="receipt-items">
                <div className="item-header">
                    <span className="col-qty">Qty</span>
                    <span className="col-item">Item</span>
                    <span className="col-price">Amt</span>
                </div>
                {order.items.map((item, idx) => (
                    <div key={idx} className="item-row">
                        <span className="col-qty">{item.quantity}</span>
                        <span className="col-item">{item.food_name}</span>
                        <span className="col-price">{(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
                <div className="receipt-divider">--------------------------------</div>
            </div>

            <div className="receipt-summary">
                <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>Rs. {subtotal.toFixed(2)}</span>
                </div>
                {additionalCharges > 0 && (
                    <div className="summary-row">
                        <span>Service/Delivery:</span>
                        <span>Rs. {additionalCharges.toFixed(2)}</span>
                    </div>
                )}
                <div className="summary-row total-row">
                    <span>Total:</span>
                    <span>Rs. {total.toFixed(2)}</span>
                </div>
            </div>

            <div className="receipt-footer">
                <p>Thank you for dining with us!</p>
                <p>Please come again.</p>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default PrintableOrder;
