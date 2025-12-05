// Main JavaScript file for Aesthete Book Cafe

// API Base URL - Update this based on your local setup
const API_BASE_URL = 'http://localhost/aesthete-book-cafe/api';

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Check if user is admin
function isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

// Get user data from localStorage
function getUserData() {
    return {
        id: localStorage.getItem('userId'),
        username: localStorage.getItem('username'),
        email: localStorage.getItem('email'),
        isAdmin: localStorage.getItem('isAdmin') === 'true'
    };
}

// Load component dynamically (header, footer, etc.)
async function loadComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load ${filePath}: ${response.status}`);
        }
        const html = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
            
            // Execute any scripts in the loaded HTML
            const scripts = element.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                newScript.textContent = script.textContent;
                document.body.appendChild(newScript);
                document.body.removeChild(newScript);
            });
            
            // Update navigation if this is the header
            if (elementId === 'header-container') {
                updateNavigation();
            }
        }
    } catch (error) {
        console.error('Error loading component:', error);
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<div style="color: #f44336; padding: 20px; text-align: center;">
                Error loading component: ${error.message}
            </div>`;
        }
    }
}

// Update navigation based on user login status
function updateNavigation() {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;
    
    if (isLoggedIn()) {
        const user = getUserData();
        authButtons.innerHTML = `
            <span style="margin-right: 10px; color: var(--color-dark);">
                <i class="fas fa-user-circle"></i> ${user.username}
            </span>
            ${user.isAdmin ? 
                '<a href="admin/index.html" class="btn btn-outline">Admin Panel</a>' : 
                '<a href="dashboard.html" class="btn btn-outline">Dashboard</a>'
            }
            <button onclick="logout()" class="btn btn-primary">Logout</button>
        `;
    } else {
        authButtons.innerHTML = `
            <a href="login.html" class="btn btn-outline">Login</a>
            <a href="register.html" class="btn btn-primary">Register</a>
        `;
    }
}

// Show notification
function showNotification(message, type = 'success', duration = 3000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        z-index: 1001;
        animation: slideIn 0.3s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-width: 300px;
        max-width: 500px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Remove notification after duration
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, duration);
}

// Handle API errors
function handleApiError(error) {
    console.error('API Error:', error);
    showNotification(error.message || 'An error occurred. Please try again.', 'error');
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('isAdmin');
    
    showNotification('Logged out successfully');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Format date
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

// Format time
function formatTime(timeString) {
    try {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    } catch (error) {
        return timeString;
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone
function validatePhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone);
}

// Redirect if not logged in
function requireAuth() {
    if (!isLoggedIn()) {
        showNotification('Please login to access this page', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return false;
    }
    return true;
}

// Redirect if not admin
function requireAdmin() {
    if (!isLoggedIn()) {
        showNotification('Please login to access this page', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return false;
    }
    
    if (!isAdmin()) {
        showNotification('Access denied. Admin privileges required.', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        return false;
    }
    
    return true;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on an admin page
    if (window.location.pathname.includes('/admin/')) {
        requireAdmin();
    }
    
    // Check if we're on a protected page (dashboard)
    if (window.location.pathname.includes('dashboard.html')) {
        requireAuth();
    }
    
    // Auto-update navigation on all pages
    setTimeout(updateNavigation, 1000);
});


