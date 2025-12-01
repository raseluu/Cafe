// Check if user is logged in
function checkAuth() {
    fetch('backend/includes/check_auth.php')
        .then(response => response.json())
        .then(data => {
            if (!data.loggedIn) {
                // Redirect to home if not logged in
                window.location.href = 'index.html';
            } else {
                // Load user data
                loadUserData(data.user);
            }
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            window.location.href = 'index.html';
        });
}

// Load user data
function loadUserData(user) {
    // Update header
    document.getElementById('userName').textContent = user.name.split(' ')[0];
    document.getElementById('userNameHero').textContent = user.name;
    
    // Update profile
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('updateName').value = user.name;
    document.getElementById('updateEmail').value = user.email;
    document.getElementById('updatePhone').value = user.phone;
    
    // Update member since
    const memberDate = new Date(user.created_at);
    const monthYear = memberDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    document.getElementById('memberSince').textContent = monthYear;
    
    // Load user events
    loadUserEvents();
}

// Load user events
function loadUserEvents() {
    const container = document.getElementById('myEventsContainer');
    
    fetch('backend/includes/get_user_events.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.events.length === 0) {
                    container.innerHTML = `
                        <div class="no-events">
                            <i class="fas fa-calendar-times"></i>
                            <h3>No Event Registrations Yet</h3>
                            <p>You haven't registered for any events. Browse our upcoming events and join us!</p>
                            <a href="events.html" class="btn-primary">Browse Events</a>
                        </div>
                    `;
                } else {
                    // Update total events count
                    document.getElementById('totalEvents').textContent = data.events.length;
                    
                    // Display events
                    container.innerHTML = data.events.map(event => {
                        const date = new Date(event.event_date);
                        const day = date.getDate().toString().padStart(2, '0');
                        const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                        
                        return `
                            <div class="my-event-card">
                                <div class="event-date-small">
                                    <div class="day">${day}</div>
                                    <div class="month">${month}</div>
                                </div>
                                <div class="my-event-info">
                                    <h4>${event.title}</h4>
                                    <p><i class="fas fa-clock"></i> ${event.event_time}</p>
                                    <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                                    <p><i class="fas fa-users"></i> ${event.guests} guest(s)</p>
                                    <p><i class="fas fa-calendar"></i> Registered: ${new Date(event.registered_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span class="event-status ${event.status}">${event.status}</span>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            } else {
                container.innerHTML = '<div class="loading">Failed to load events</div>';
            }
        })
        .catch(error => {
            console.error('Error loading events:', error);
            container.innerHTML = '<div class="loading">Error loading events</div>';
        });
}

// Tab switching
const dashboardTabs = document.querySelectorAll('.dashboard-tab:not(#logoutBtn)');
dashboardTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        
        // Remove active class from all tabs
        dashboardTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Hide all tab contents
        document.querySelectorAll('.dashboard-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Show selected tab content
        document.getElementById(tabName + 'Tab').classList.add('active');
    });
});

// Update Profile Form
const updateProfileForm = document.getElementById('updateProfileForm');
if (updateProfileForm) {
    updateProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('updateName').value.trim();
        const phone = document.getElementById('updatePhone').value.trim();
        
        fetch('backend/includes/update_profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, phone })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('✅ ' + data.message);
                // Update displayed name
                document.getElementById('userName').textContent = name.split(' ')[0];
                document.getElementById('userNameHero').textContent = name;
                document.getElementById('profileName').textContent = name;
            } else {
                alert('❌ ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('❌ Failed to update profile');
        });
    });
}

// Change Password Form
const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        // Validation
        if (newPassword.length < 8) {
            alert('❌ New password must be at least 8 characters');
            return;
        }
        
        if (newPassword !== confirmNewPassword) {
            alert('❌ New passwords do not match');
            return;
        }
        
        fetch('backend/includes/change_password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('✅ ' + data.message);
                changePasswordForm.reset();
            } else {
                alert('❌ ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('❌ Failed to change password');
        });
    });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            fetch('backend/includes/logout.php')
                .then(response => response.json())
                .then(data => {
                    alert('✅ ' + data.message);
                    window.location.href = 'index.html';
                })
                .catch(error => {
                    console.error('Error:', error);
                    window.location.href = 'index.html';
                });
        }
    });
}

// Delete Account
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
        const confirmation = prompt('Are you sure? Type "DELETE" to confirm:');
        
        if (confirmation === 'DELETE') {
            fetch('backend/includes/delete_account.php', {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                if (data.success) {
                    window.location.href = 'index.html';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('❌ Failed to delete account');
            });
        }
    });
}

// Back to Top Button (reuse from main script)
const backToTopBtn = document.getElementById('backToTop');
if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize on page load
checkAuth();