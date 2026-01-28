
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
    form.addEventListener('submit', (e) => {
        e.preventDefault();

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

        console.log('Order Items:', selectedItems);

        // Send data back to Bot via Messenger Extensions
        if (typeof MessengerExtensions !== 'undefined') {
            MessengerExtensions.getContext('YOUR_APP_ID',
                function success(thread_context) {
                    // For simplified Phase 1, we can't easily push data back unless we have the loop set up.
                    // Standard approach: Close webview and let backend know via a separate call or just tell user to type "Done".

                    // Since we don't have the full post-back flow ready in backend yet, 
                    // we will rely on a neat trick: Just close it and we simulate the message 
                    // OR we can trigger a postback if supported.

                    // For now, let's try closing. 
                    // NOTE: Passing data back usually requires `MessengerExtensions.beginShareFlow` or a backend endpoint.

                    // Let's assume we call our backend endpoint first to save the state, then close.
                    // fetch('/api/webview-submit', { ... })

                    alert('Items selected! (Simulated)');
                    MessengerExtensions.requestCloseBrowser(function success() { }, function error(err) { });
                },
                function error(err) {
                    console.error(err);
                    // Fallback for testing in browser
                    alert('Order submitted: ' + JSON.stringify(selectedItems));
                }
            );
        } else {
            // Browser fallback
            alert('Order submitted (Browser Mode): ' + JSON.stringify(selectedItems));
        }
    });
});
