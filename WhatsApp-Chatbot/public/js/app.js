
// ===== STATE MANAGEMENT =====
const state = {
    menuData: [],
    cart: {},
    currentCategory: 'all',
    searchQuery: ''
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    await loadMenuData();
    setupEventListeners();
    renderCategories(); // This will now use data from the backend if possible, or derive from items
    renderMenu();
    hideLoading();
}

async function loadMenuData() {
    try {
        // Fetch ALL items at once
        const res = await fetch('/api/menu?all=true');
        const data = await res.json();

        if (data.success && Array.isArray(data.items)) {
            state.menuData = data.items;
        } else {
            console.error('Failed to load menu data', data);
            showToast('Failed to load menu', 'error');
        }
    } catch (error) {
        console.error('Network error loading menu', error);
        showToast('Network error', 'error');
    }
}

function hideLoading() {
    const loadingEl = document.getElementById('menu-loading');
    if (loadingEl) loadingEl.style.display = 'none';
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            state.searchQuery = '';
            clearSearch.classList.remove('visible');
            renderMenu();
        });
    }

    // Cart toggle (old collapsible cart)
    const cartToggle = document.getElementById('cart-toggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', toggleCart);
    }

    // Cart modal
    const openCartBtn = document.getElementById('open-cart-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cartModal = document.getElementById('cart-modal');
    const modalCheckoutBtn = document.getElementById('modal-checkout-btn');

    if (openCartBtn) openCartBtn.addEventListener('click', openCartModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeCartModal);

    // Close modal when clicking outside
    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) {
                closeCartModal();
            }
        });
    }

    // Modal checkout button
    if (modalCheckoutBtn) {
        modalCheckoutBtn.addEventListener('click', () => {
            handleCheckout();
            closeCartModal();
        });
    }

    // Form submission
    const form = document.getElementById('order-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCheckout();
        });
    }
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    state.searchQuery = query;

    const clearBtn = document.getElementById('clear-search');
    if (query) {
        clearBtn.classList.add('visible');
    } else {
        clearBtn.classList.remove('visible');
    }

    renderMenu();
}

// ===== RENDER FUNCTIONS =====
function renderCategories() {
    // Derive categories from the data + "All"
    const uniqueCategories = new Set(state.menuData.map(item => item.category));
    const categories = ['all', ...Array.from(uniqueCategories)];

    const tabsContainer = document.getElementById('category-tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = categories.map(cat => {
        const displayName = cat === 'all' ? '🍽️ All' : (cat.charAt(0).toUpperCase() + cat.slice(1));
        return `
            <button type="button" 
                    class="category-tab ${cat === state.currentCategory ? 'active' : ''}" 
                    data-category="${cat}"
                    role="tab"
                    aria-selected="${cat === state.currentCategory}">
                ${displayName}
            </button>
        `;
    }).join('');

    // Add click listeners
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            state.currentCategory = e.target.dataset.category;
            renderCategories(); // Re-render to update active class
            renderMenu();
        });
    });
}

function renderMenu() {
    const menuList = document.getElementById('menu-list');
    const emptyState = document.getElementById('empty-state');
    if (!menuList) return;

    let filteredItems = state.menuData;

    // Filter by category
    if (state.currentCategory !== 'all') {
        filteredItems = filteredItems.filter(item => item.category === state.currentCategory);
    }

    // Filter by search
    if (state.searchQuery) {
        filteredItems = filteredItems.filter(item =>
            item.name.toLowerCase().includes(state.searchQuery) ||
            (item.description && item.description.toLowerCase().includes(state.searchQuery))
        );
    }

    // Show empty state if no results
    if (filteredItems.length === 0) {
        menuList.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    menuList.innerHTML = filteredItems.map(item => renderMenuItem(item)).join('');

    // Add event listeners to quantity buttons
    attachQuantityListeners();
}

function renderMenuItem(item) {
    const quantity = state.cart[item.id] || 0;
    const itemTotal = (quantity * parseFloat(item.price)).toFixed(2);
    const isSelected = quantity > 0;
    const price = parseFloat(item.price).toFixed(2);

    // Fallback image if none provided
    const imageSrc = item.image_url || 'https://placehold.co/80x80?text=No+Image';

    return `
        <div class="menu-item ${isSelected ? 'selected' : ''}" data-item-id="${item.id}">
            <div style="display: flex; gap: 15px;">
                <img src="${imageSrc}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                <div style="flex: 1;">
                    <div class="item-header">
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <div class="item-description">${item.description || ''}</div>
                        </div>
                        <div class="item-price">$${price}</div>
                    </div>
                </div>
            </div>
            
            <div class="quantity-controls">
                <div class="qty-btn-group">
                    <button type="button" 
                            class="qty-btn qty-minus" 
                            data-item-id="${item.id}"
                            ${quantity === 0 ? 'disabled' : ''}
                            aria-label="Decrease quantity">
                        −
                    </button>
                    <span class="qty-display">${quantity}</span>
                    <button type="button" 
                            class="qty-btn qty-plus" 
                            data-item-id="${item.id}"
                            aria-label="Increase quantity">
                        +
                    </button>
                </div>
                ${quantity > 0 ? `<div class="item-total">$${itemTotal}</div>` : ''}
            </div>
        </div>
    `;
}

function attachQuantityListeners() {
    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = parseInt(e.target.dataset.itemId);
            updateQuantity(itemId, 1);
        });
    });

    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = parseInt(e.target.dataset.itemId);
            updateQuantity(itemId, -1);
        });
    });
}

// ===== CART MANAGEMENT =====
function updateQuantity(itemId, delta) {
    const currentQty = state.cart[itemId] || 0;
    const newQty = Math.max(0, currentQty + delta);

    if (newQty === 0) {
        delete state.cart[itemId];
    } else {
        state.cart[itemId] = newQty;
    }

    // Update UI
    renderMenu();
    updateCartPreview();
    updateTotal();

    // Show toast notification
    const item = state.menuData.find(i => i.id === itemId);
    if (item) {
        if (delta > 0) {
            showToast(`Added ${item.name} ✓`);
        } else if (newQty === 0) {
            showToast(`Removed ${item.name}`);
        }
    }
}

function updateCartPreview() {
    const cartPreview = document.getElementById('cart-preview');
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    if (!cartPreview || !cartItems || !cartCount) return;

    const itemCount = Object.values(state.cart).reduce((sum, qty) => sum + qty, 0);

    if (itemCount === 0) {
        cartPreview.style.display = 'none';
        return;
    }

    cartPreview.style.display = 'block';
    cartCount.textContent = itemCount;

    const cartHTML = Object.entries(state.cart).map(([itemId, quantity]) => {
        const item = state.menuData.find(i => i.id === parseInt(itemId));
        if (!item) return '';
        const itemTotal = (item.price * quantity).toFixed(2);

        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-qty">Qty: ${quantity}</div>
                </div>
                <div class="cart-item-price">$${itemTotal}</div>
            </div>
        `;
    }).join('');

    cartItems.innerHTML = cartHTML;
}

function toggleCart() {
    const cartToggle = document.getElementById('cart-toggle');
    const cartItems = document.getElementById('cart-items');
    if (cartToggle) cartToggle.classList.toggle('expanded');
    if (cartItems) cartItems.classList.toggle('expanded');
}

function updateTotal() {
    const total = Object.entries(state.cart).reduce((sum, [itemId, quantity]) => {
        const item = state.menuData.find(i => i.id === parseInt(itemId));
        return sum + (item ? (item.price * quantity) : 0);
    }, 0);

    const itemCount = Object.values(state.cart).reduce((sum, qty) => sum + qty, 0);

    const priceEl = document.getElementById('total-price');
    if (priceEl) priceEl.textContent = `$${total.toFixed(2)}`;

    // Update footer cart badge
    const footerBadge = document.getElementById('footer-cart-count');
    if (footerBadge) {
        if (itemCount > 0) {
            footerBadge.style.display = 'flex';
            footerBadge.textContent = itemCount;
        } else {
            footerBadge.style.display = 'none';
        }
    }

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.disabled = total === 0;

    const modalCheckoutBtn = document.getElementById('modal-checkout-btn');
    if (modalCheckoutBtn) {
        modalCheckoutBtn.disabled = total === 0;
    }
}

// ===== CART MODAL FUNCTIONS =====
function openCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.add('active');
        renderCartModal();
        document.body.style.overflow = 'hidden';
    }
}

function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function renderCartModal() {
    const modalBody = document.getElementById('cart-modal-body');
    if (!modalBody) return;

    const itemCount = Object.values(state.cart).reduce((sum, qty) => sum + qty, 0);

    if (itemCount === 0) {
        modalBody.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p style="font-size: 1.25rem; margin-bottom: 0.5rem;">Your cart is empty</p>
                <small>Add some delicious items to get started!</small>
            </div>
        `;
        updateModalTotal();
        return;
    }

    const cartHTML = Object.entries(state.cart).map(([itemId, quantity]) => {
        const item = state.menuData.find(i => i.id === parseInt(itemId));
        if (!item) return '';
        const itemTotal = (item.price * quantity).toFixed(2);

        return `
            <div class="modal-cart-item">
                <div class="modal-item-info">
                    <div class="modal-item-name">${item.name}</div>
                    <div class="modal-item-price">$${parseFloat(item.price).toFixed(2)} each</div>
                </div>
                <div class="modal-qty-controls">
                    <button type="button" 
                            class="modal-qty-btn modal-qty-minus" 
                            data-item-id="${item.id}"
                            aria-label="Decrease quantity">
                        −
                    </button>
                    <span class="modal-qty-display">${quantity}</span>
                    <button type="button" 
                            class="modal-qty-btn modal-qty-plus" 
                            data-item-id="${item.id}"
                            aria-label="Increase quantity">
                        +
                    </button>
                </div>
                <div class="modal-item-total">$${itemTotal}</div>
            </div>
        `;
    }).join('');

    modalBody.innerHTML = cartHTML;
    updateModalTotal();

    // Attach event listeners to modal quantity buttons
    document.querySelectorAll('.modal-qty-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = parseInt(e.target.dataset.itemId);
            updateQuantity(itemId, 1);
            renderCartModal();
        });
    });

    document.querySelectorAll('.modal-qty-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = parseInt(e.target.dataset.itemId);
            updateQuantity(itemId, -1);
            renderCartModal();
        });
    });
}

function updateModalTotal() {
    const total = Object.entries(state.cart).reduce((sum, [itemId, quantity]) => {
        const item = state.menuData.find(i => i.id === parseInt(itemId));
        return sum + (item ? (item.price * quantity) : 0);
    }, 0);

    const subtotalEl = document.getElementById('modal-subtotal');
    const totalEl = document.getElementById('modal-total');
    if (subtotalEl) subtotalEl.textContent = `$${total.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type}`;

    // Trigger reflow
    void toast.offsetWidth;

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// ===== FORM SUBMISSION =====
async function handleCheckout() {
    // Get userId from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');

    if (!userId) {
        showToast('Error: User ID missing. Cannot place order.', 'error');
        return;
    }

    const orderData = Object.entries(state.cart).map(([itemId, quantity]) => {
        const item = state.menuData.find(i => i.id === parseInt(itemId));
        return {
            foodId: item.id,
            name: item.name,
            quantity: quantity,
            price: item.price
        };
    });

    if (orderData.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }

    showToast('Processing order...', 'success');

    try {
        const response = await fetch('/api/messenger/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                items: orderData
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Order placed successfully! 🎉', 'success');

            // Wait a moment for the toast to be seen
            setTimeout(() => {
                // 1. Try Messenger Extensions
                if (typeof MessengerExtensions !== 'undefined') {
                    MessengerExtensions.requestCloseBrowser(
                        function success() {
                            console.log("Webview closed via MessengerExtensions");
                        },
                        function error(err) {
                            console.error('Error closing webview via MessengerExtensions:', err);
                            window.close(); // Fallback
                        }
                    );
                }

                // 2. Try standard window.close() (works for some webviews/popups)
                try {
                    window.close();
                } catch (e) {
                    console.error('window.close() failed', e);
                }

                // 3. Fallback UI if it hasn't closed yet
                setTimeout(() => {
                    document.body.innerHTML = `
                        <div style="text-align:center; padding: 50px; font-family: sans-serif;">
                            <h1>✅ Order Sent!</h1>
                            <p>You can close this window manually and return to the chat.</p>
                            <button onclick="window.close()" style="margin-top:20px; padding:10px 20px; background:#e74c3c; color:white; border:none; border-radius:5px; cursor:pointer;">Close Window</button>
                        </div>
                    `;
                }, 500);

            }, 2000);

            // Reset cart
            state.cart = {};
            updateTotal();

        } else {
            showToast('Failed to place order: ' + (result.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Order submission error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}
