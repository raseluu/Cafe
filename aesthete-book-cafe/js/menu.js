// Menu functionality

let cartItems = [];
let currentTab = 'coffee';

// Initialize menu
function initializeMenu() {
    // Load cart from localStorage
    loadCart();
    
    // Setup tab switching
    setupTabs();
    
    // Setup booking form
    setupBookingForm();
    
    // Auto-populate booking form if user is logged in
    autoPopulateBookingForm();
}

// Setup tab switching
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Update active button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show selected tab
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                    currentTab = tabId;
                }
            });
            
            // Scroll to tab content
            document.querySelector('.menu-tabs').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('menuCart');
    if (savedCart) {
        try {
            cartItems = JSON.parse(savedCart);
            updateCartCount();
        } catch (error) {
            console.error('Error loading cart:', error);
            cartItems = [];
        }
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('menuCart', JSON.stringify(cartItems));
    updateCartCount();
}

// Update cart count in header
function updateCartCount() {
    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    
    // Find or create cart indicator in header
    let cartIndicator = document.querySelector('.cart-indicator');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (!cartIndicator && authButtons) {
        cartIndicator = document.createElement('span');
        cartIndicator.className = 'cart-indicator';
        cartIndicator.style.cssText = `
            position: relative;
            display: inline-flex;
            align-items: center;
            margin-left: 10px;
        `;
        
        const cartIcon = document.createElement('i');
        cartIcon.className = 'fas fa-shopping-cart';
        cartIcon.style.cssText = 'font-size: 1.2rem; color: var(--color-primary);';
        
        const countBadge = document.createElement('span');
        countBadge.id = 'cartCountBadge';
        countBadge.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: var(--color-primary);
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        cartIndicator.appendChild(cartIcon);
        cartIndicator.appendChild(countBadge);
        
        // Add click handler to show cart
        cartIndicator.addEventListener('click', showCartModal);
        cartIndicator.style.cursor = 'pointer';
        
        // Insert after auth buttons
        authButtons.parentNode.insertBefore(cartIndicator, authButtons.nextSibling);
    }
    
    const countBadge = document.getElementById('cartCountBadge');
    if (countBadge) {
        if (cartCount > 0) {
            countBadge.textContent = cartCount;
            countBadge.style.display = 'flex';
        } else {
            countBadge.style.display = 'none';
        }
    }
}

// Order item
function orderItem(name, price) {
    // Check if item already in cart
    const existingItem = cartItems.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            name: name,
            price: price,
            quantity: 1,
            addedAt: new Date().toISOString()
        });
    }
    
    saveCart();
    
    // Show notification
    showNotification(`Added ${name} to cart!`, 'success');
    
    // Animate the button
    const buttons = document.querySelectorAll(`.order-btn[onclick*="${name}"]`);
    buttons.forEach(button => {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    });
}

// Show cart modal
function showCartModal() {
    if (cartItems.length === 0) {
        showNotification('Your cart is empty', 'info');
        return;
    }
    
    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'booking-modal show';
    modal.id = 'cartModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div style="padding: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h3 style="margin: 0; color: var(--color-dark);">Your Order</h3>
                    <button onclick="closeCartModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                </div>
                
                <div id="cartItems" style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
                    ${cartItems.map((item, index) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee;">
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: var(--color-dark);">${item.name}</div>
                                <div style="color: var(--color-primary); font-weight: 600;">$${item.price.toFixed(2)} each</div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <button onclick="updateQuantity(${index}, -1)" style="
                                        width: 30px;
                                        height: 30px;
                                        border-radius: 50%;
                                        border: 1px solid #ddd;
                                        background: white;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                    ">-</button>
                                    <span style="min-width: 30px; text-align: center; font-weight: 600;">${item.quantity}</span>
                                    <button onclick="updateQuantity(${index}, 1)" style="
                                        width: 30px;
                                        height: 30px;
                                        border-radius: 50%;
                                        border: 1px solid #ddd;
                                        background: white;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                    ">+</button>
                                </div>
                                <div style="font-weight: 600; color: var(--color-dark); min-width: 60px; text-align: right;">
                                    $${(item.price * item.quantity).toFixed(2)}
                                </div>
                                <button onclick="removeFromCart(${index})" style="
                                    background: none;
                                    border: none;
                                    color: #E74C3C;
                                    cursor: pointer;
                                    padding: 5px;
                                ">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="
                    padding: 20px;
                    background: var(--color-light);
                    border-radius: 8px;
                    margin-bottom: 25px;
                ">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Subtotal</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Tax (8%)</span>
                        <span>$${(total * 0.08).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 600; color: var(--color-dark);">
                        <span>Total</span>
                        <span>$${(total * 1.08).toFixed(2)}</span>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px;">
                    <button onclick="checkout()" class="btn btn-primary" style="flex: 1;">
                        <i class="fas fa-credit-card"></i> Checkout
                    </button>
                    <button onclick="clearCart()" class="btn btn-outline">
                        <i class="fas fa-trash"></i> Clear
                    </button>
                </div>
                
                <div style="margin-top: 20px; text-align: center; color: #666; font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> Orders are for in-cafe consumption only
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeCartModal();
        }
    });
}

// Close cart modal
function closeCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.remove();
    }
}

// Update item quantity
function updateQuantity(index, change) {
    if (index >= 0 && index < cartItems.length) {
        const newQuantity = cartItems[index].quantity + change;
        
        if (newQuantity < 1) {
            removeFromCart(index);
        } else {
            cartItems[index].quantity = newQuantity;
            saveCart();
            updateCartDisplay();
        }
    }
}

// Remove item from cart
function removeFromCart(index) {
    if (index >= 0 && index < cartItems.length) {
        const itemName = cartItems[index].name;
        cartItems.splice(index, 1);
        saveCart();
        updateCartDisplay();
        showNotification(`Removed ${itemName} from cart`, 'info');
    }
}

// Clear cart
function clearCart() {
    if (cartItems.length > 0 && confirm('Clear all items from cart?')) {
        cartItems = [];
        saveCart();
        closeCartModal();
        showNotification('Cart cleared', 'info');
    }
}

// Update cart display
function updateCartDisplay() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        closeCartModal();
        showCartModal();
    }
}

// Checkout
function checkout() {
    if (!isLoggedIn()) {
        showNotification('Please login to place an order', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    // In a real app, this would process payment
    // For now, we'll simulate it
    showNotification('Processing your order...', 'info');
    
    // Simulate API call
    setTimeout(() => {
        // Send order to server
        const orderData = {
            items: cartItems,
            total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.08,
            userId: localStorage.getItem('userId'),
            timestamp: new Date().toISOString()
        };
        
        // Save order to localStorage for demo
        const orders = JSON.parse(localStorage.getItem('userOrders') || '[]');
        orders.push(orderData);
        localStorage.setItem('userOrders', JSON.stringify(orders));
        
        // Clear cart
        cartItems = [];
        saveCart();
        
        // Close modal
        closeCartModal();
        
        // Show success message
        showNotification('Order placed successfully! Your items will be prepared.', 'success');
        
        // Show order details
        setTimeout(() => {
            alert(`Order confirmed!\n\nItems: ${orderData.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}\nTotal: $${orderData.total.toFixed(2)}\n\nPlease proceed to the counter to pay and collect your order.`);
        }, 500);
        
    }, 1500);
}

// Setup booking form
function setupBookingForm() {
    const form = document.getElementById('bookingForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitBooking();
        });
        
        // Set minimum date to today
        const dateInput = document.getElementById('bookingDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            
            // Set default to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.value = tomorrow.toISOString().split('T')[0];
        }
        
        // Set default time to next available hour
        const timeInput = document.getElementById('bookingTime');
        if (timeInput) {
            const now = new Date();
            const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
            timeInput.value = `${nextHour.getHours().toString().padStart(2, '0')}:00`;
        }
    }
}

// Auto-populate booking form
function autoPopulateBookingForm() {
    if (isLoggedIn()) {
        const userData = getUserData();
        const nameInput = document.getElementById('bookingName');
        const phoneInput = document.getElementById('bookingPhone');
        
        if (nameInput && userData.username) {
            nameInput.value = userData.username;
        }
        
        // In a real app, you'd fetch user phone from profile
        // For now, we'll leave it blank
    }
}

// Show booking modal
function showBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

// Close booking modal
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Re-enable scrolling
    }
}

// Submit booking
function submitBooking() {
    const form = document.getElementById('bookingForm');
    if (!form) return;
    
    // Get form data
    const bookingData = {
        name: document.getElementById('bookingName').value.trim(),
        phone: document.getElementById('bookingPhone').value.trim(),
        date: document.getElementById('bookingDate').value,
        time: document.getElementById('bookingTime').value,
        guests: document.getElementById('bookingGuests').value,
        requests: document.getElementById('bookingRequests').value.trim(),
        submittedAt: new Date().toISOString()
    };
    
    // Validation
    if (!bookingData.name || !bookingData.phone || !bookingData.date || !bookingData.time || !bookingData.guests) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate date is not in the past
    const selectedDate = new Date(bookingData.date + 'T' + bookingData.time);
    if (selectedDate < new Date()) {
        showNotification('Please select a future date and time', 'error');
        return;
    }
    
    // Validate phone
    if (!validatePhone(bookingData.phone)) {
        showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    // In a real app, you would send this to your server
    // For now, we'll save to localStorage
    const bookings = JSON.parse(localStorage.getItem('tableBookings') || '[]');
    bookings.push(bookingData);
    localStorage.setItem('tableBookings', JSON.stringify(bookings));
    
    // Show success message
    showNotification('Table booked successfully! We\'ll confirm via phone.', 'success');
    
    // Close modal
    closeBookingModal();
    
    // Reset form
    form.reset();
    
    // Send confirmation (in real app, this would be an email/SMS)
    setTimeout(() => {
        alert(`Booking Confirmed!\n\nName: ${bookingData.name}\nDate: ${bookingData.date}\nTime: ${bookingData.time}\nGuests: ${bookingData.guests}\n\nWe look forward to seeing you!`);
    }, 500);
}

// Filter menu items
function filterMenuItems(category, searchTerm = '') {
    const items = document.querySelectorAll('.menu-item');
    items.forEach(item => {
        const itemCategory = item.closest('.tab-content').id.replace('-tab', '');
        const itemText = item.textContent.toLowerCase();
        
        const matchesCategory = category === 'all' || itemCategory === category;
        const matchesSearch = !searchTerm || itemText.includes(searchTerm.toLowerCase());
        
        if (matchesCategory && matchesSearch) {
            item.style.display = '';
            // Add highlight animation for search matches
            if (searchTerm && matchesSearch) {
                item.style.animation = 'highlight 1s ease';
            }
        } else {
            item.style.display = 'none';
        }
    });
}

// Search menu
function searchMenu() {
    const searchInput = document.querySelector('#menuSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim();
            filterMenuItems(currentTab, searchTerm);
        });
    }
}

// Add highlight animation to CSS
const highlightStyle = document.createElement('style');
highlightStyle.textContent = `
    @keyframes highlight {
        0% { background-color: transparent; }
        50% { background-color: #FFF9C4; }
        100% { background-color: transparent; }
    }
`;
document.head.appendChild(highlightStyle);

// Initialize search when page loads
document.addEventListener('DOMContentLoaded', function() {
    searchMenu();
});