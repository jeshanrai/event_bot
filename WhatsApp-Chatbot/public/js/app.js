
// ===== STATE MANAGEMENT =====
const state = {
    menuData: [],
    cart: {},
    currentCategory: 'all',
    searchQuery: '',
    userId: null
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Get userId and restaurantId from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    state.userId = urlParams.get('userId') || urlParams.get('user_id') || urlParams.get('psid');
    state.restaurantId = urlParams.get('restaurantId') || urlParams.get('restaurant_id');

    console.log('User ID:', state.userId);
    console.log('Restaurant ID:', state.restaurantId);

    await loadMenuData();
    loadRestaurantInfo(); // Load restaurant name for header (non-blocking)
    await loadUserCart(); // Load user's session cart
    setupEventListeners();
    renderCategories(); // This will now use data from the backend if possible, or derive from items
    renderMenu();
    updateCartPreview(); // Update preview with loaded cart
    updateTotal();       // Update total
    hideLoading();
}

async function loadUserCart() {
    // Use userId from state (already parsed in initializeApp)
    const userId = state.userId;

    if (!userId) return;

    try {
        const res = await fetch(`/api/cart/${userId}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.cart)) {
            // Convert backend array [{foodId, quantity}] to frontend object {itemId: quantity}
            state.cart = {};
            data.cart.forEach(item => {
                state.cart[item.foodId] = item.quantity;
            });
            console.log('Cart loaded from session:', state.cart);
        }
    } catch (error) {
        console.error('Error loading user cart:', error);
    }
}

async function loadMenuData() {
    try {
        // Fetch ALL items at once
        const restaurantIdParam = state.restaurantId ? `&restaurantId=${state.restaurantId}` : '';
        const res = await fetch(`/api/menu?all=true${restaurantIdParam}`);
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

async function loadRestaurantInfo() {
    const restaurantId = state.restaurantId || 1;
    try {
        const res = await fetch(`/api/restaurant/${restaurantId}`);
        const data = await res.json();

        if (data.success && data.restaurant) {
            const nameEl = document.getElementById('restaurant-name');
            const subtitleEl = document.getElementById('restaurant-subtitle');

            if (nameEl) nameEl.textContent = data.restaurant.name;
            if (subtitleEl && data.restaurant.address) {
                subtitleEl.textContent = data.restaurant.address;
            }

            // Update page title
            document.title = `${data.restaurant.name} - Menu`;
        }
    } catch (error) {
        console.error('Error loading restaurant info:', error);
        // Fallback - keep the "Loading..." text or set generic
        const nameEl = document.getElementById('restaurant-name');
        if (nameEl) nameEl.textContent = 'Menu';
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
            closeCartModal();
            showPaymentModal();
        });
    }

    // Payment modal
    const closePaymentModalBtn = document.getElementById('close-payment-modal');
    const paymentModal = document.getElementById('payment-modal');
    const payCashBtn = document.getElementById('pay-cash-btn');
    const payStripeBtn = document.getElementById('pay-stripe-btn');

    if (closePaymentModalBtn) closePaymentModalBtn.addEventListener('click', closePaymentModal);
    if (paymentModal) {
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) closePaymentModal();
        });
    }
    if (payCashBtn) payCashBtn.addEventListener('click', handleCashPayment);
    if (payStripeBtn) payStripeBtn.addEventListener('click', handleStripePayment);

    // Form submission
    const form = document.getElementById('order-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            showPaymentModal();
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

// Update a single menu item's UI without re-rendering the entire list
function updateMenuItemUI(itemId, quantity) {
    const menuItem = document.querySelector(`.menu-item[data-item-id="${itemId}"]`);
    if (!menuItem) return;

    const item = state.menuData.find(i => i.id === itemId);
    if (!item) return;

    const itemTotal = (quantity * parseFloat(item.price)).toFixed(2);
    const isSelected = quantity > 0;

    // Update selected state
    if (isSelected) {
        menuItem.classList.add('selected');
    } else {
        menuItem.classList.remove('selected');
    }

    // Update quantity display
    const qtyDisplay = menuItem.querySelector('.qty-display');
    if (qtyDisplay) qtyDisplay.textContent = quantity;

    // Update minus button disabled state
    const minusBtn = menuItem.querySelector('.qty-minus');
    if (minusBtn) minusBtn.disabled = quantity === 0;

    // Update item total
    const quantityControls = menuItem.querySelector('.quantity-controls');
    let itemTotalEl = menuItem.querySelector('.item-total');

    if (quantity > 0) {
        if (!itemTotalEl) {
            itemTotalEl = document.createElement('div');
            itemTotalEl.className = 'item-total';
            quantityControls.appendChild(itemTotalEl);
        }
        itemTotalEl.textContent = `$${itemTotal}`;
    } else if (itemTotalEl) {
        itemTotalEl.remove();
    }
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

    // Update UI - targeted update instead of full re-render
    updateMenuItemUI(itemId, newQty);
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

    // Sync with backend
    syncCartWithBackend();
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

async function syncCartWithBackend() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    if (!userId) return;

    // Convert state.cart to array format expected by backend
    const cartItems = Object.entries(state.cart).map(([itemId, quantity]) => {
        const item = state.menuData.find(i => i.id === parseInt(itemId));
        if (!item) return null;
        return {
            foodId: item.id,
            name: item.name,
            price: item.price,
            quantity: quantity
        };
    }).filter(item => item !== null);

    try {
        await fetch(`/api/cart/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cartItems })
        });
    } catch (e) {
        console.error("Failed to sync cart", e);
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

// ===== PAYMENT MODAL FUNCTIONS =====
function showPaymentModal() {
    const itemCount = Object.values(state.cart).reduce((sum, qty) => sum + qty, 0);
    if (itemCount === 0) {
        showToast('Cart is empty', 'error');
        return;
    }

    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.classList.add('active');
        updatePaymentModalTotal();
        document.body.style.overflow = 'hidden';
    }
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function updatePaymentModalTotal() {
    const total = Object.entries(state.cart).reduce((sum, [itemId, quantity]) => {
        const item = state.menuData.find(i => i.id === parseInt(itemId));
        return sum + (item ? (item.price * quantity) : 0);
    }, 0);

    const totalEl = document.getElementById('payment-modal-total');
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

async function handleCashPayment() {
    const payCashBtn = document.getElementById('pay-cash-btn');
    if (payCashBtn) payCashBtn.classList.add('loading');

    await processPayment('cash');
}

async function handleStripePayment() {
    const payStripeBtn = document.getElementById('pay-stripe-btn');
    if (payStripeBtn) payStripeBtn.classList.add('loading');

    await processPayment('stripe');
}

async function processPayment(paymentMethod) {
    // Use userId from global state
    const userId = state.userId;

    if (!userId) {
        showToast('Error: User ID missing. Please reopen from chat.', 'error');
        closePaymentModal();
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
        closePaymentModal();
        return;
    }

    showToast('Processing...', 'success');

    try {
        const response = await fetch('/api/webview/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                restaurantId: state.restaurantId, // Pass restaurant ID for multi-tenant
                items: orderData,
                paymentMethod: paymentMethod
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Checkout failed');
        }

        // Format order number as 4 digits (pad with zeros)
        const orderNumber = result.orderId ? String(result.orderId).padStart(4, '0') : '0000';

        if (paymentMethod === 'stripe' && result.paymentUrl) {
            // Redirect to Stripe payment page
            showToast(`Order #${orderNumber} - Redirecting to payment...`, 'success');
            window.location.href = result.paymentUrl;
        } else {
            // Cash payment - order confirmed
            state.cart = {};
            updateTotal();
            closePaymentModal();

            // Try to close webview after 1.5 seconds
            setTimeout(() => {
                // 1. Try Messenger Extensions
                if (typeof MessengerExtensions !== 'undefined') {
                    MessengerExtensions.requestCloseBrowser(
                        function success() { /* Closed successfully */ },
                        function error(err) {
                            // Silently fail - user will see the success screen
                            console.log("MessengerExtensions close failed (expected in testing):", err);
                        }
                    );
                }

                // 2. Try window.close()
                try {
                    window.close();
                } catch (e) {
                    // Ignore expected security error
                }
            }, 1500);

            // Show success screen with clear instruction
            document.body.innerHTML = `
                <div style="text-align:center; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 350px; width: 100%;">
                        <div style="font-size: 4rem; margin-bottom: 20px;">✅</div>
                        <h1 style="color: #2d3436; margin-bottom: 10px; font-size: 1.5rem;">Order Confirmed!</h1>
                        
                        <div style="background: linear-gradient(135deg, #00B894 0%, #00a884 100%); color: white; padding: 15px; border-radius: 12px; margin: 20px 0;">
                            <div style="font-size: 0.85rem; opacity: 0.9;">Your Order Number</div>
                            <div style="font-size: 2.5rem; font-weight: 700; letter-spacing: 3px;">#${orderNumber}</div>
                        </div>

                        <p style="color: #636e72; margin-bottom: 25px; line-height: 1.5;">
                            Please pay at the counter.<br>
                            <strong>You can now close this window.</strong>
                        </p>

                        <button onclick="window.close()" style="width: 100%; padding: 14px; background: #dfe6e9; color: #2d3436; border: none; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: 600;">
                            Close Window
                        </button>
                    </div>
                </div>
            `;
        }

    } catch (error) {
        console.error('Checkout error:', error);
        showToast('Error: ' + error.message, 'error');

        // Remove loading state
        const payCashBtn = document.getElementById('pay-cash-btn');
        const payStripeBtn = document.getElementById('pay-stripe-btn');
        if (payCashBtn) payCashBtn.classList.remove('loading');
        if (payStripeBtn) payStripeBtn.classList.remove('loading');
    }
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
                items: orderData,
                mode: 'replace' // Tell backend to use this exact cart
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
