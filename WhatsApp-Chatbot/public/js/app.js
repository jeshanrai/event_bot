
// Wait for DOM to allow checkboxes to toggle selects
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('order-form');
    const submitBtn = document.getElementById('submit-btn');
    const checkboxes = document.querySelectorAll('input[name="item"]');
    const totalPriceEl = document.getElementById('total-price');

    // Messenger Extensions Logic
    window.extAsyncInit = function () {
        console.log('Messenger Extensions Loaded');
    };

    // Toggle Quantity Select on Checkbox
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const row = e.target.closest('.menu-item');
            const select = row.querySelector('select[name="qty"]');

            if (e.target.checked) {
                select.disabled = false;
            } else {
                select.disabled = true;
                select.value = "1"; // Reset
            }
            updateTotal();
        });
    });

    // Update total when quantity changes
    document.querySelectorAll('select[name="qty"]').forEach(select => {
        select.addEventListener('change', updateTotal);
    });

    function updateTotal() {
        let total = 0;
        let count = 0;

        checkboxes.forEach(cb => {
            if (cb.checked) {
                const price = parseFloat(cb.dataset.price);
                const row = cb.closest('.menu-item');
                const qty = parseInt(row.querySelector('select[name="qty"]').value);
                total += price * qty;
                count += qty;
            }
        });

        totalPriceEl.textContent = '$' + total.toFixed(2);
        submitBtn.textContent = count > 0 ? `Add ${count} Items` : 'Add to Order';
        submitBtn.disabled = count === 0;
    }

    // Handle Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get userId from URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');

        if (!userId) {
            alert('Error: User ID missing from URL. Cannot place order.');
            return;
        }

        const selectedItems = [];
        checkboxes.forEach(cb => {
            if (cb.checked) {
                const row = cb.closest('.menu-item');
                const qty = parseInt(row.querySelector('select[name="qty"]').value);
                selectedItems.push({
                    name: cb.value,
                    quantity: qty,
                    price: parseFloat(cb.dataset.price)
                });
            }
        });

        if (selectedItems.length === 0) {
            alert('Please select at least one item.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        try {
            // Send data to backend
            const response = await fetch('/api/messenger/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    items: selectedItems
                })
            });

            const result = await response.json();

            if (result.success) {
                // Determine environment and close window
                if (typeof MessengerExtensions !== 'undefined') {
                    MessengerExtensions.requestCloseBrowser(
                        function success() {
                            // Webview closed
                        },
                        function error(err) {
                            console.error(err);
                            // If close fails, show success message
                            document.body.innerHTML = `
                                <div style="text-align:center; padding: 50px; font-family: sans-serif;">
                                    <h1>✅ Order Sent!</h1>
                                    <p>You can close this window and return to the chat.</p>
                                </div>
                            `;
                        }
                    );
                } else {
                    alert('Order sent successfully! You can close this window.');
                }
            } else {
                alert('Error: ' + (result.message || 'Failed to send order'));
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add to Order';
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Network error. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add to Order';
        }
    });
});
