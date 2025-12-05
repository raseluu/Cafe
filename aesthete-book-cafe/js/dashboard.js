// Dashboard functionality

let userData = null;
let userEvents = [];
let userMessages = [];
let currentSection = 'overview';

// Initialize dashboard
async function initializeDashboard() {
    try {
        // Get user data
        userData = getUserData();
        if (!userData || !userData.id) {
            throw new Error('User data not found');
        }
        
        // Update UI with user data
        updateUserProfile();
        
        // Load initial data
        await loadDashboardData();
        
        // Setup event listeners
        setupDashboardListeners();
        
        // Set current date
        updateCurrentDate();
        
        // Setup section switching
        setupSectionSwitching();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showNotification('Error loading dashboard', 'error');
    }
}

// Update user profile in sidebar
function updateUserProfile() {
    if (!userData) return;
    
    // Set user name and email
    document.getElementById('userName').textContent = userData.username || 'User';
    document.getElementById('userEmail').textContent = userData.email || '';
    
    // Set avatar initials
    const avatar = document.getElementById('userAvatar');
    const name = userData.username || 'User';
    const initials = name.charAt(0).toUpperCase();
    avatar.innerHTML = `<span style="font-size: 32px; font-weight: bold;">${initials}</span>`;
    
    // Update member since
    document.getElementById('memberSince').textContent = new Date().getFullYear();
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load user events
        await loadUserEvents();
        
        // Load user messages
        await loadUserMessages();
        
        // Load user stats
        await loadUserStats();
        
        // Load recent activity
        await loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load user events
async function loadUserEvents() {
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) return;
        
        const response = await fetch(`${API_BASE_URL}/events/get-registrations.php?user_id=${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            userEvents = data.events || [];
            updateEventsCount();
            displayUserEvents();
        }
    } catch (error) {
        console.error('Error loading user events:', error);
    }
}

// Load user messages
async function loadUserMessages() {
    try {
        // For now, we'll use contact messages where email matches
        const userEmail = localStorage.getItem('email');
        if (!userEmail) return;
        
        // In a real app, you'd have a proper user messages API
        // For now, we'll simulate it
        userMessages = [];
        updateMessagesCount();
        
    } catch (error) {
        console.error('Error loading user messages:', error);
    }
}

// Load user stats
async function loadUserStats() {
    try {
        // Update stats in sidebar
        document.getElementById('eventsCount').textContent = userEvents.length;
        document.getElementById('booksCount').textContent = '0'; // Will need books API
        document.getElementById('messagesCount').textContent = userMessages.length;
        
        // Update overview stats
        const upcomingEvents = userEvents.filter(event => {
            const eventDate = new Date(event.event_date + 'T' + event.event_time);
            return eventDate > new Date();
        });
        
        document.getElementById('upcomingEventsCount').textContent = upcomingEvents.length;
        
        // Calculate total spent
        const totalSpent = userEvents.reduce((sum, event) => sum + (parseFloat(event.price) || 0), 0);
        document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);
        
        // Find next event
        if (upcomingEvents.length > 0) {
            const nextEvent = upcomingEvents.sort((a, b) => 
                new Date(a.event_date + 'T' + a.event_time) - new Date(b.event_date + 'T' + b.event_time)
            )[0];
            
            const nextEventDate = formatDate(nextEvent.event_date);
            document.getElementById('nextEventDate').textContent = nextEventDate;
        } else {
            document.getElementById('nextEventDate').textContent = 'None';
        }
        
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const activityList = document.getElementById('activityList');
        
        // Generate activities from user events
        const activities = [];
        
        // Add event registrations as activities
        userEvents.slice(0, 5).forEach(event => {
            const eventDate = new Date(event.event_date + 'T' + event.event_time);
            const isUpcoming = eventDate > new Date();
            
            activities.push({
                icon: isUpcoming ? 'calendar-plus' : 'calendar-check',
                title: isUpcoming ? 'Event Registration' : 'Attended Event',
                description: `Registered for "${event.title}"`,
                time: formatDate(event.registration_date),
                color: isUpcoming ? '#9C6B46' : '#4CAF50'
            });
        });
        
        // Add profile update activity
        activities.push({
            icon: 'user-edit',
            title: 'Profile Updated',
            description: 'You updated your profile information',
            time: 'Today',
            color: '#2196F3'
        });
        
        // Display activities
        if (activities.length > 0) {
            activityList.innerHTML = activities.map(activity => `
                <li class="activity-item">
                    <div class="activity-icon" style="background: ${activity.color}20; color: ${activity.color};">
                        <i class="fas fa-${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${activity.title}</h4>
                        <p>${activity.description}</p>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </li>
            `).join('');
        } else {
            activityList.innerHTML = `
                <li class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="activity-content">
                        <h4>No Recent Activity</h4>
                        <p>Your activity will appear here</p>
                    </div>
                </li>
            `;
        }
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Display user events
function displayUserEvents(filter = 'all') {
    const container = document.getElementById('userEventsContainer');
    
    if (!userEvents || userEvents.length === 0) {
        container.innerHTML = `
            <div class="no-events">
                <i class="fas fa-calendar"></i>
                <h3>No Events Yet</h3>
                <p>You haven't registered for any events yet.</p>
                <a href="events.html" class="btn btn-primary" style="margin-top: 15px;">Browse Events</a>
            </div>
        `;
        return;
    }
    
    // Filter events
    let filteredEvents = [...userEvents];
    const now = new Date();
    
    switch(filter) {
        case 'upcoming':
            filteredEvents = userEvents.filter(event => {
                const eventDate = new Date(event.event_date + 'T' + event.event_time);
                return eventDate > now;
            });
            break;
        case 'past':
            filteredEvents = userEvents.filter(event => {
                const eventDate = new Date(event.event_date + 'T' + event.event_time);
                return eventDate < now;
            });
            break;
        // 'all' - no filter
    }
    
    if (filteredEvents.length === 0) {
        container.innerHTML = `
            <div class="no-events">
                <i class="fas fa-filter"></i>
                <h3>No ${filter} Events</h3>
                <p>You don't have any ${filter} events.</p>
            </div>
        `;
        return;
    }
    
    // Sort events by date
    filteredEvents.sort((a, b) => {
        const dateA = new Date(a.event_date + 'T' + a.event_time);
        const dateB = new Date(b.event_date + 'T' + b.event_time);
        return dateA - dateB;
    });
    
    // Display events
    container.innerHTML = filteredEvents.map(event => {
        const eventDate = new Date(event.event_date + 'T' + event.event_time);
        const isUpcoming = eventDate > new Date();
        const formattedDate = formatDate(event.event_date);
        const formattedTime = formatTime(event.event_time);
        
        return `
            <div class="event-card-dash">
                <div class="event-header-dash">
                    <h3 class="event-title-dash">${event.title}</h3>
                    <span class="event-date-dash">${formattedDate}</span>
                </div>
                <div class="event-body-dash">
                    <div class="event-meta-dash">
                        <div class="meta-item-dash">
                            <i class="far fa-clock"></i>
                            <span>${formattedTime}</span>
                        </div>
                        <div class="meta-item-dash">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${event.venue || 'Aesthete Book Cafe'}</span>
                        </div>
                        ${event.price > 0 ? `
                            <div class="meta-item-dash">
                                <i class="fas fa-tag"></i>
                                <span>${formatCurrency(event.price)}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <span class="event-status status-${event.status || 'confirmed'}">
                            ${event.status || 'confirmed'}
                        </span>
                        <span style="margin-left: 10px; color: #666; font-size: 0.9rem;">
                            Registered: ${formatDate(event.registration_date)}
                        </span>
                    </div>
                    
                    ${event.description ? `
                        <p style="color: #666; margin: 15px 0; font-size: 0.95rem;">
                            ${event.description.length > 150 ? event.description.substring(0, 150) + '...' : event.description}
                        </p>
                    ` : ''}
                    
                    <div class="event-actions" style="display: flex; gap: 10px; margin-top: 20px;">
                        <button class="btn btn-outline" onclick="viewEventDetails(${event.id})">
                            View Details
                        </button>
                        ${isUpcoming ? `
                            <button class="btn btn-outline" onclick="cancelEventRegistration(${event.id})" style="color: #f44336; border-color: #f44336;">
                                Cancel Registration
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update events count
function updateEventsCount() {
    const eventsCount = userEvents.length;
    document.getElementById('eventsCount').textContent = eventsCount;
}

// Update messages count
function updateMessagesCount() {
    const messagesCount = userMessages.length;
    document.getElementById('messagesCount').textContent = messagesCount;
    document.getElementById('unreadMessagesCount').textContent = '0';
    document.getElementById('totalMessagesCount').textContent = messagesCount;
}

// Setup dashboard event listeners
function setupDashboardListeners() {
    // Profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateProfile();
        });
    }
    
    // Change password form submission
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await changePassword();
        });
    }
    
    // Events filter
    const eventsFilter = document.getElementById('eventsFilter');
    if (eventsFilter) {
        eventsFilter.addEventListener('change', function() {
            displayUserEvents(this.value);
        });
    }
    
    // Settings checkboxes
    const checkboxes = document.querySelectorAll('.checkbox-label input');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Save setting immediately or on blur
            saveSetting(this.id, this.checked);
        });
    });
}

// Setup section switching
function setupSectionSwitching() {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const sectionId = this.dataset.section;
            
            // Update active menu item
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `${sectionId}-section`) {
                    section.classList.add('active');
                    currentSection = sectionId;
                    
                    // Load section-specific data
                    switch(sectionId) {
                        case 'events':
                            displayUserEvents('all');
                            break;
                        case 'messages':
                            loadUserMessages();
                            break;
                    }
                }
            });
        });
    });
}

// Update current date
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

// Update profile
async function updateProfile() {
    try {
        const form = document.getElementById('profileForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate
        if (!data.email) {
            showNotification('Email is required', 'error');
            return;
        }
        
        if (!validateEmail(data.email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // Get token and user ID
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
            showNotification('Authentication required', 'error');
            return;
        }
        
        // Prepare update data
        const updateData = {
            id: userId,
            email: data.email,
            full_name: data.first_name && data.last_name ? 
                `${data.first_name} ${data.last_name}` : null,
            phone: data.phone || null,
            address: data.address || null,
            bio: data.bio || null
        };
        
        // In a real app, you'd call an API to update the profile
        // For now, we'll simulate it
        showNotification('Profile updated successfully!');
        
        // Update localStorage if email changed
        if (data.email !== userData.email) {
            localStorage.setItem('email', data.email);
            userData.email = data.email;
            updateUserProfile();
        }
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error updating profile', 'error');
    }
}

// Change password
async function changePassword() {
    try {
        const form = document.getElementById('changePasswordForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate
        if (!data.current_password || !data.new_password || !data.confirm_password) {
            showNotification('All password fields are required', 'error');
            return;
        }
        
        if (data.new_password.length < 6) {
            showNotification('New password must be at least 6 characters', 'error');
            return;
        }
        
        if (data.new_password !== data.confirm_password) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        
        // Get token and user ID
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
            showNotification('Authentication required', 'error');
            return;
        }
        
        // In a real app, you'd call an API to change password
        // For now, we'll simulate it
        showNotification('Password changed successfully!');
        
        // Reset form
        form.reset();
        hideChangePassword();
        
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Error changing password', 'error');
    }
}

// Cancel event registration
async function cancelEventRegistration(eventId) {
    if (!confirm('Are you sure you want to cancel this event registration?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
            showNotification('Authentication required', 'error');
            return;
        }
        
        // In a real app, you'd call an API to cancel registration
        // For now, we'll simulate it
        showNotification('Event registration cancelled');
        
        // Remove event from list
        userEvents = userEvents.filter(event => event.id !== eventId);
        updateEventsCount();
        displayUserEvents(document.getElementById('eventsFilter').value);
        
    } catch (error) {
        console.error('Error cancelling event registration:', error);
        showNotification('Error cancelling registration', 'error');
    }
}

// Save settings
async function saveSettings() {
    try {
        // Get settings from checkboxes
        const settings = {
            notifyEvents: document.getElementById('notifyEvents').checked,
            notifyNews: document.getElementById('notifyNews').checked,
            notifyMessages: document.getElementById('notifyMessages').checked,
            showProfile: document.getElementById('showProfile').checked,
            showEvents: document.getElementById('showEvents').checked
        };
        
        // Save to localStorage
        localStorage.setItem('userSettings', JSON.stringify(settings));
        
        showNotification('Settings saved successfully!');
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Error saving settings', 'error');
    }
}

// Save individual setting
function saveSetting(settingId, value) {
    try {
        // Get current settings
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        
        // Update setting
        settings[settingId] = value;
        
        // Save back to localStorage
        localStorage.setItem('userSettings', JSON.stringify(settings));
        
    } catch (error) {
        console.error('Error saving setting:', error);
    }
}

// Export user data
function exportData() {
    showNotification('Data export feature coming soon!');
    // In a real app, this would generate and download a JSON/CSV file
}

// Request account deletion
function requestDeletion() {
    if (!confirm('Are you sure you want to request account deletion? This action cannot be undone.')) {
        return;
    }
    
    showNotification('Account deletion request submitted. We will contact you shortly.');
}

// Refresh messages
function refreshMessages() {
    loadUserMessages();
    showNotification('Messages refreshed');
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.innerHTML = '<i class="far fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        toggle.innerHTML = '<i class="far fa-eye"></i>';
    }
}

// Show change password form
function showChangePassword() {
    document.getElementById('changePasswordSection').style.display = 'block';
}

// Hide change password form
function hideChangePassword() {
    document.getElementById('changePasswordSection').style.display = 'none';
    document.getElementById('changePasswordForm').reset();
}

// Reset profile form
function resetProfileForm() {
    document.getElementById('profileForm').reset();
    showNotification('Form reset to original values');
}

// Load user settings
function loadUserSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        
        // Apply settings to checkboxes
        if (settings.notifyEvents !== undefined) {
            document.getElementById('notifyEvents').checked = settings.notifyEvents;
        }
        if (settings.notifyNews !== undefined) {
            document.getElementById('notifyNews').checked = settings.notifyNews;
        }
        if (settings.notifyMessages !== undefined) {
            document.getElementById('notifyMessages').checked = settings.notifyMessages;
        }
        if (settings.showProfile !== undefined) {
            document.getElementById('showProfile').checked = settings.showProfile;
        }
        if (settings.showEvents !== undefined) {
            document.getElementById('showEvents').checked = settings.showEvents;
        }
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Initialize settings when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadUserSettings();
});