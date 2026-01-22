import React from 'react';
import { Phone } from 'lucide-react';
import './OrderInfoCard.css';

const OrderInfoCard = ({ order }) => {
    return (
        <div className="info-card">
            <div className="info-column">
                <span className="info-label">Preparing time</span>
                <span className="info-value">00h : 25m : 30s</span>
            </div>

            <div className="info-column">
                <span className="info-label">Address</span>
                <span className="info-value">{order.delivery_address || 'Dine-in'}</span>
            </div>

            <div className="info-column">
                <span className="info-label">Payment Method</span>
                <span className="info-value">{order.payment_method || 'Cash'}</span>
            </div>

            <div className="info-column">
                <span className="info-label">Platform</span>
                <span className="info-value" style={{ textTransform: 'capitalize' }}>{order.platform || 'Web'}</span>
            </div>

            <div className="info-column">
                <div className="info-row-flex">
                    <div>
                        <span className="info-label">{order.customer_name || 'Customer'}</span>
                        <div className="info-value">{order.customer_phone || 'N/A'}</div>
                    </div>
                    {order.customer_phone && (
                        <a href={`tel:${order.customer_phone}`} className="call-btn" title="Call customer">
                            <Phone size={18} fill="currentColor" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderInfoCard;
