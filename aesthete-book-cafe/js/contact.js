// Contact page JavaScript

// Initialize contact page
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on contact page
    if (window.location.pathname.includes('contact.html')) {
        setupContactForm();
        setupQuickLinks();
    }
});

// Setup contact form
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    // Auto-populate user info if logged in
    if (isLoggedIn()) {
        const user = getUserData();
        const nameInput = contactForm.querySelector('input[name="name"]');
        const emailInput = contactForm.querySelector('input[name="email"]');
        
        if (nameInput && !nameInput.value) {
            nameInput.value = user.username;
        }
        if (emailInput && !emailInput.value) {
            emailInput.value = user.email;
        }
    }
    
    // Add character counter for message
    const messageInput = contactForm.querySelector('textarea[name="message"]');
    if (messageInput) {
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.cssText = `
            text-align: right;
            font-size: 0.8rem;
            color: #666;
            margin-top: 5px;
        `;
        messageInput.parentNode.appendChild(counter);
        
        messageInput.addEventListener('input', function() {
            const length = this.value.length;
            counter.textContent = `${length}/2000 characters`;
            
            if (length > 2000) {
                counter.style.color = '#f44336';
            } else if (length > 1900) {
                counter.style.color = '#ff9800';
            } else {
                counter.style.color = '#666';
            }
        });
        
        // Trigger initial count
        messageInput.dispatchEvent(new Event('input'));
    }
    
    // Form validation
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        // Validate
        let isValid = true;
        const errors = [];
        
        if (!data.name.trim()) {
            errors.push('Name is required');
            isValid = false;
        }
        
        if (!data.email.trim()) {
            errors.push('Email is required');
            isValid = false;
        } else if (!validateEmail(data.email)) {
            errors.push('Please enter a valid email address');
            isValid = false;
        }
        
        if (!data.subject) {
            errors.push('Please select a subject');
            isValid = false;
        }
        
        if (!data.message.trim()) {
            errors.push('Message is required');
            isValid = false;
        } else if (data.message.length > 2000) {
            errors.push('Message is too long (max 2000 characters)');
            isValid = false;
        }
        
        if (!isValid) {
            showNotification(errors.join('<br>'), 'error');
            return;
        }
        
        // Submit form
        await submitContactForm(data);
    });
}

// Submit contact form
async function submitContactForm(data) {
    const submitBtn = document.querySelector('#contactForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/contact.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Thank you for your message! We\'ll get back to you soon.');
            
            // Reset form
            document.getElementById('contactForm').reset();
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <div style="
                    background: #d4edda;
                    color: #155724;
                    padding: 20px;
                    border-radius: 4px;
                    margin-top: 20px;
                    text-align: center;
                ">
                    <i class="fas fa-check-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <h3 style="margin: 10px 0;">Message Sent Successfully!</h3>
                    <p>Reference #: ${result.message_id}</p>
                    <p>We\'ve sent a confirmation email to ${data.email}</p>
                </div>
            `;
            
            const form = document.getElementById('contactForm');
            form.parentNode.insertBefore(successMessage, form.nextSibling);
            
            // Remove success message after 10 seconds
            setTimeout(() => {
                if (successMessage.parentNode) {
                    successMessage.remove();
                }
            }, 10000);
        } else {
            showNotification(result.message || 'Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('An error occurred. Please try again later.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Setup quick contact links
function setupQuickLinks() {
    // Phone click to call
    const phoneElements = document.querySelectorAll('[data-phone]');
    phoneElements.forEach(element => {
        element.addEventListener('click', function() {
            const phone = this.dataset.phone || this.textContent;
            const cleanPhone = phone.replace(/[^\d+]/g, '');
            window.location.href = `tel:${cleanPhone}`;
        });
    });
    
    // Email click to mail
    const emailElements = document.querySelectorAll('[data-email]');
    emailElements.forEach(element => {
        element.addEventListener('click', function() {
            const email = this.dataset.email || this.textContent;
            window.location.href = `mailto:${email}`;
        });
    });
    
    // Map click to open in Google Maps
    const addressElements = document.querySelectorAll('[data-address]');
    addressElements.forEach(element => {
        element.addEventListener('click', function() {
            const address = encodeURIComponent(this.dataset.address || '123 Book Street, Reading City');
            window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
        });
    });
}

// Get contact messages (admin function)
async function getContactMessages(limit = 50, offset = 0, unread = false) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        let url = `${API_BASE_URL}/contact/get-messages.php?limit=${limit}&offset=${offset}`;
        if (unread) {
            url += '&unread=true';
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        throw error;
    }
}

// Mark message as read (admin function)
async function markMessageAsRead(messageId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_BASE_URL}/contact/mark-read.php`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message_id: messageId })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error marking message as read:', error);
        throw error;
    }
}

// Delete message (admin function)
async function deleteMessage(messageId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_BASE_URL}/contact/delete-message.php`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message_id: messageId })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error deleting message:', error);
        throw error;
    }
}