import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Loader, Upload } from 'lucide-react';
import { getMenuItems, getCategories, createMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability, uploadMenuCsv } from '../../services/menuApi';
import './OwnerDashboard.css';

const MenuManager = () => {
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [editingItem, setEditingItem] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
        available: true
    });

    const fileInputRef = useRef(null);

    // Handle CSV file upload
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            alert('Please upload a valid CSV file');
            return;
        }

        try {
            setSaving(true);
            const result = await uploadMenuCsv(file);
            alert(`Upload complete! Added: ${result.success}, Errors: ${result.errors}`);
            await fetchData();
        } catch (err) {
            console.error('Error uploading CSV:', err);
            alert(err || 'Failed to upload CSV file');
        } finally {
            setSaving(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Fetch categories and items on mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [categoriesData, itemsData] = await Promise.all([
                getCategories(),
                getMenuItems()
            ]);
            setCategories(categoriesData);
            setItems(itemsData);
            if (categoriesData.length > 0 && !activeCategory) {
                setActiveCategory(categoriesData[0].name);
            }
        } catch (err) {
            console.error('Error fetching menu data:', err);
            setError('Failed to load menu data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item => item.category === activeCategory);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Open add modal
    const openAddModal = (category = '') => {
        setModalMode('add');
        setFormData({
            name: '',
            description: '',
            price: '',
            category: category || activeCategory || '',
            image_url: '',
            available: true
        });
        setEditingItem(null);
        setShowModal(true);
    };

    // Open edit modal
    const openEditModal = (item) => {
        setModalMode('edit');
        setFormData({
            name: item.name,
            description: item.description || '',
            price: item.price.toString(),
            category: item.category,
            image_url: item.image_url || '',
            available: item.available
        });
        setEditingItem(item);
        setShowModal(true);
    };

    // Close modal
    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            category: '',
            image_url: '',
            available: true
        });
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields including description and image_url
        if (!formData.name || !formData.price || !formData.category || !formData.description || !formData.image_url) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setSaving(true);
            const data = {
                ...formData,
                price: parseFloat(formData.price)
            };

            if (modalMode === 'add') {
                await createMenuItem(data);
            } else {
                await updateMenuItem(editingItem.id, data);
            }

            await fetchData();
            closeModal();
        } catch (err) {
            console.error('Error saving menu item:', err);
            alert('Failed to save menu item. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deletingItem) return;

        try {
            setSaving(true);
            await deleteMenuItem(deletingItem.id);
            await fetchData();
            setShowDeleteConfirm(false);
            setDeletingItem(null);
        } catch (err) {
            console.error('Error deleting menu item:', err);
            alert('Failed to delete menu item. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Handle availability toggle
    const handleToggleAvailability = async (item) => {
        try {
            await toggleAvailability(item.id, !item.available);
            setItems(items.map(i =>
                i.id === item.id ? { ...i, available: !i.available } : i
            ));
        } catch (err) {
            console.error('Error toggling availability:', err);
            alert('Failed to update availability. Please try again.');
        }
    };

    // Open delete confirmation
    const openDeleteConfirm = (item) => {
        setDeletingItem(item);
        setShowDeleteConfirm(true);
    };

    if (loading) {
        return (
            <div className="menu-manager">
                <div className="loading-state">
                    <Loader className="spinner" size={32} />
                    <p>Loading menu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="menu-manager">
                <div className="error-state">
                    <p>{error}</p>
                    <button className="primary-btn" onClick={fetchData}>Try Again</button>
                </div>
            </div>
        );
    }

    return (
        <div className="menu-manager">
            <header className="frame-header">
                <div>
                    <h2 className="frame-title">Menu Manager</h2>
                    <p className="frame-subtitle">Add, update, and manage your menu items</p>
                </div>
                <div className="header-actions">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv"
                        style={{ display: 'none' }}
                    />
                    <button className="secondary-btn" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                        <Upload size={18} />
                        <span>Import CSV</span>
                    </button>
                    <button className="primary-btn" onClick={() => openAddModal()}>
                        <Plus size={18} />
                        <span>Add Item</span>
                    </button>
                </div>
            </header>

            <div className="menu-content">
                {/* Categories Sidebar */}
                <aside className="menu-categories">
                    <h3 className="section-header">Categories</h3>
                    <div className="category-list">
                        {categories.map(cat => (
                            <button
                                key={cat.name}
                                className={`category-item ${activeCategory === cat.name ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat.name)}
                            >
                                <span>{cat.name}</span>
                                <span className="cat-count">{cat.count}</span>
                            </button>
                        ))}
                        <button className="add-category-btn" onClick={() => openAddModal('')}>
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
                                    <div className="item-actions">
                                        <button className="edit-btn" onClick={() => openEditModal(item)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="delete-btn" onClick={() => openDeleteConfirm(item)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {item.description && (
                                    <p className="item-description">{item.description}</p>
                                )}

                                <div className="item-card-footer">
                                    <div className="item-price">Rs. {item.price}</div>
                                    <label className="availability-switch">
                                        <input
                                            type="checkbox"
                                            checked={item.available}
                                            onChange={() => handleToggleAvailability(item)}
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
                        <button className="add-item-card" onClick={() => openAddModal(activeCategory)}>
                            <Plus size={32} />
                            <span>Add {activeCategory} Item</span>
                        </button>
                    </div>
                </main>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <>
                    <div className="modal-overlay" onClick={closeModal}></div>
                    <div className="menu-modal">
                        <div className="modal-header">
                            <h3>{modalMode === 'add' ? 'Add Menu Item' : 'Edit Menu Item'}</h3>
                            <button className="close-modal-btn" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="name">Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter item name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description *</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    className="form-textarea"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter item description"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="price">Price (Rs.) *</label>
                                    <input
                                        type="number"
                                        id="price"
                                        name="price"
                                        className="form-input"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="category">Category *</label>
                                    <input
                                        type="text"
                                        id="category"
                                        name="category"
                                        className="form-input"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Momo, Beverages"
                                        list="category-list"
                                        required
                                    />
                                    <datalist id="category-list">
                                        {categories.map(cat => (
                                            <option key={cat.name} value={cat.name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="image_url">Image URL *</label>
                                <input
                                    type="url"
                                    id="image_url"
                                    name="image_url"
                                    className="form-input"
                                    value={formData.image_url}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/image.jpg"
                                    required
                                />
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="available"
                                        checked={formData.available}
                                        onChange={handleInputChange}
                                    />
                                    <span>Available for ordering</span>
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader className="spinner" size={16} />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <span>{modalMode === 'add' ? 'Add Item' : 'Save Changes'}</span>
                                    )}
                                </button>
                            </div>
                        </form >
                    </div >
                </>
            )}

            {/* Delete Confirmation Modal */}
            {
                showDeleteConfirm && (
                    <>
                        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}></div>
                        <div className="confirm-modal">
                            <h3>Delete Menu Item</h3>
                            <p>Are you sure you want to delete <strong>{deletingItem?.name}</strong>? This action cannot be undone.</p>
                            <div className="modal-actions">
                                <button className="secondary-btn" onClick={() => setShowDeleteConfirm(false)}>
                                    Cancel
                                </button>
                                <button className="danger-btn" onClick={handleDelete} disabled={saving}>
                                    {saving ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </>
                )
            }
        </div >
    );
};

export default MenuManager;
