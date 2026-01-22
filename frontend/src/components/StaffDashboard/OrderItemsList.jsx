import React from 'react';
import './OrderItemsList.css';

const OrderItemsList = ({ items, totalAmount, specialInstructions }) => {
    // Fallback image if no image_url is provided
    const fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

    return (
        <>
            <div className="items-section">
                {items?.map((item, idx) => (
                    <div key={idx} className="item-card">
                        <div className="item-image">
                            <img
                                src={item.image_url || fallbackImage}
                                alt={item.food_name || 'Food item'}
                                onError={(e) => { e.target.src = fallbackImage; }}
                            />
                        </div>
                        <div className="item-name">
                            {item.food_name || `Dish #${item.food_id}`}
                        </div>
                        <div className="item-quantity">
                            x{item.quantity}
                        </div>
                        <div className="item-note">
                            {item.notes || specialInstructions || 'No special instructions'}
                        </div>
                        <div className="item-price">
                            Rs. {item.unit_price}
                        </div>
                    </div>
                ))}
            </div>

        </>
    );

};

export default OrderItemsList;
