import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, Search } from 'lucide-react';
import './OwnerDashboard.css';

const MenuManager = () => {
    // Mock Data
    const [categories, setCategories] = useState([
        { id: 1, name: 'Momo', count: 12 },
        { id: 2, name: 'Chowmein', count: 8 },
        { id: 3, name: 'Beverages', count: 5 },
        { id: 4, name: 'Burger', count: 6 },
    ]);

    const [activeCategory, setActiveCategory] = useState(1);

    const [items, setItems] = useState([
        { id: 101, name: 'Steamed Buff Momo', price: 150, available: true, categoryId: 1 },
        { id: 102, name: 'Fried Buff Momo', price: 180, available: true, categoryId: 1 },
        { id: 103, name: 'C. Buff Momo', price: 200, available: false, categoryId: 1 },
        { id: 201, name: 'Veg Chowmein', price: 120, available: true, categoryId: 2 },
    ]);

    const filteredItems = items.filter(item => item.categoryId === activeCategory);

    // Toggle Availability
    const toggleAvailability = (id) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, available: !item.available } : item
        ));
    };

    return (
        <div className="menu-manager">
            <header className="frame-header">
                <div>
                    <h2 className="frame-title">Menu Manager</h2>
                    <p className="frame-subtitle">Update prices and availability</p>
                </div>
                <button className="primary-btn">
                    <Plus size={18} />
                    <span>Add Item</span>
                </button>
            </header>

            <div className="menu-content">
                {/* Categories Sidebar */}
                <aside className="menu-categories">
                    <h3 className="section-header">Categories</h3>
                    <div className="category-list">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                <span>{cat.name}</span>
                                <span className="cat-count">{cat.count}</span>
                            </button>
                        ))}
                        <button className="add-category-btn">
                            <Plus size={16} />
                            <span>New Category</span>
                        </button>
                    </div>
                </aside>

                {/* Items Grid */}
                <main className="menu-items-area">
                    <div className="items-grid">
                        {filteredItems.map(item => (
                            <div key={item.id} className={`menu-item-card ${!item.available ? 'unavailable' : ''}`}>
                                <div className="item-card-header">
                                    <h4 className="item-name">{item.name}</h4>
                                    <button className="edit-btn">
                                        <Edit2 size={16} />
                                    </button>
                                </div>

                                <div className="item-card-footer">
                                    <div className="item-price">Rs. {item.price}</div>
                                    <label className="availability-switch">
                                        <input
                                            type="checkbox"
                                            checked={item.available}
                                            onChange={() => toggleAvailability(item.id)}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="availability-text">
                                    {item.available ? 'Available' : 'Unavailable'}
                                </div>
                            </div>
                        ))}

                        {/* Add New Item Card */}
                        <button className="add-item-card">
                            <Plus size={32} />
                            <span>Add {categories.find(c => c.id === activeCategory)?.name} Item</span>
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MenuManager;
