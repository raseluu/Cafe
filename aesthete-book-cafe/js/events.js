// Events functionality

// Load upcoming events on homepage
async function loadUpcomingEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events/get-events.php?upcoming=true&limit=3`);
        const data = await response.json();
        
        if (data.success && data.events.length > 0) {
            const container = document.getElementById('events-container');
            container.innerHTML = data.events.map(event => createEventCard(event, true)).join('');
        } else {
            document.getElementById('events-container').innerHTML = `
                <div class="no-events" style="text-align: center; padding: 20px;">
                    <p>No upcoming events scheduled. Check back soon!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Load all events on events page
async function loadAllEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events/get-events.php`);
        const data = await response.json();
        
        if (data.success && data.events.length > 0) {
            const container = document.getElementById('events-list');
            container.innerHTML = data.events.map(event => createEventCard(event, false)).join('');
        } else {
            document.getElementById('events-list').innerHTML = `
                <div class="no-events" style="text-align: center; padding: 40px;">
                    <i class="fas fa-calendar" style="font-size: 48px; color: var(--color-gray);"></i>
                    <h3>No Events Scheduled</h3>
                    <p>Check back later for upcoming events!</p>
                </div>
            `;
        }
    } catch (error) {
        handleApiError(error);
    }
}

// Create event card HTML
function createEventCard(event, isHomepage = false) {
    const eventDate = new Date(event.event_date + 'T' + event.event_time);
    const formattedDate = formatDate(event.event_date);
    const formattedTime = formatTime(event.event_time);
    const spotsLeft = event.max_participants - event.current_participants;
    
    return `
        <div class="event-card" data-event-id="${event.id}">
            <div class="event-header">
                <h3 class="event-title">${event.title}</h3>
                <span class="event-date">
                    <i class="far fa-calendar"></i> ${formattedDate}
                </span>
            </div>
            
            <div class="event-body">
                <div class="event-image">
                    <img src="${event.image_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}" 
                         alt="${event.title}"
                         onerror="this.src='https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'">
                </div>
                
                <div class="event-details">
                    <p class="event-description">
                        ${event.description ? (event.description.length > 150 ? event.description.substring(0, 150) + '...' : event.description) : 'No description available.'}
                    </p>
                    
                    <div class="event-meta">
                        <div class="meta-item">
                            <i class="far fa-clock"></i>
                            <span>${formattedTime}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${event.venue || 'Aesthete Book Cafe'}</span>
                        </div>
                        ${event.price > 0 ? `
                            <div class="meta-item">
                                <i class="fas fa-tag"></i>
                                <span>${formatCurrency(event.price)}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${event.max_participants ? `
                        <div class="event-spots">
                            <div class="spots-progress">
                                <div class="progress-bar" style="width: ${(event.current_participants / event.max_participants) * 100}%"></div>
                            </div>
                            <div class="spots-text">
                                <span>${spotsLeft} spots left</span>
                                <span>${event.current_participants}/${event.max_participants} registered</span>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="event-actions">
                        ${isHomepage ? 
                            `<a href="events.html#event-${event.id}" class="btn btn-outline">View Details</a>` :
                            `<button class="btn btn-primary" onclick="viewEventDetails(${event.id})">View Details</button>`
                        }
                        ${isLoggedIn() && !isHomepage ? 
                            `<button class="btn btn-outline" onclick="registerForEvent(${event.id})" 
                                    ${spotsLeft <= 0 ? 'disabled' : ''}>
                                ${spotsLeft <= 0 ? 'Fully Booked' : 'Register Now'}
                            </button>` : 
                            ''
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}

// View event details
async function viewEventDetails(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/get-event.php?id=${eventId}`);
        const data = await response.json();
        
        if (data.success) {
            const event = data.event;
            const modal = createEventModal(event);
            
            // Create modal container
            const modalContainer = document.createElement('div');
            modalContainer.className = 'modal-container';
            modalContainer.innerHTML = modal;
            document.body.appendChild(modalContainer);
            
            // Show modal
            setTimeout(() => {
                modalContainer.classList.add('show');
            }, 10);
            
            // Setup modal interactions
            setupEventModal(modalContainer, event);
        }
    } catch (error) {
        handleApiError(error);
    }
}

// Create event modal HTML
function createEventModal(event) {
    const eventDate = new Date(event.event_date + 'T' + event.event_time);
    const formattedDate = formatDate(event.event_date);
    const formattedTime = formatTime(event.event_time);
    const spotsLeft = event.max_participants - event.current_participants;
    const isRegistered = event.is_registered || false;
    
    return `
        <div class="modal-content" style="
            background: white;
            border-radius: 8px;
            max-width: 800px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        ">
            <button class="close-modal" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--color-dark);
                z-index: 1;
            ">&times;</button>
            
            <div class="modal-body" style="padding: 30px;">
                <div class="event-detail-header">
                    <h2 style="color: var(--color-dark); margin-bottom: 10px;">${event.title}</h2>
                    <div class="event-meta-large" style="
                        display: flex;
                        gap: 20px;
                        margin-bottom: 30px;
                        flex-wrap: wrap;
                    ">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <i class="far fa-calendar" style="color: var(--color-primary);"></i>
                            <span>${formattedDate}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <i class="far fa-clock" style="color: var(--color-primary);"></i>
                            <span>${formattedTime}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-map-marker-alt" style="color: var(--color-primary);"></i>
                            <span>${event.venue || 'Aesthete Book Cafe'}</span>
                        </div>
                        ${event.price > 0 ? `
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <i class="fas fa-tag" style="color: var(--color-primary);"></i>
                                <span style="font-weight: bold;">${formatCurrency(event.price)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="event-detail-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div class="event-image-section">
                        <img src="${event.image_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}" 
                             alt="${event.title}"
                             style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    </div>
                    
                    <div class="event-info-section">
                        <div class="event-description-full" style="margin-bottom: 30px;">
                            <h4 style="margin-bottom: 10px;">About This Event</h4>
                            <p style="line-height: 1.8;">${event.description || 'No description available.'}</p>
                        </div>
                        
                        ${event.max_participants ? `
                            <div class="event-capacity" style="margin-bottom: 20px;">
                                <h4 style="margin-bottom: 10px;">Event Capacity</h4>
                                <div style="background: var(--color-gray); height: 10px; border-radius: 5px; overflow: hidden;">
                                    <div style="
                                        background: var(--color-primary);
                                        height: 100%;
                                        width: ${(event.current_participants / event.max_participants) * 100}%;
                                    "></div>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                                    <span>${spotsLeft} spots available</span>
                                    <span>${event.current_participants}/${event.max_participants} registered</span>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="event-actions" style="margin-top: 30px;">
                            ${isLoggedIn() ? 
                                isRegistered ? 
                                    '<button class="btn btn-success" style="width: 100%;" disabled><i class="fas fa-check"></i> Already Registered</button>' :
                                    `<button class="btn btn-primary" style="width: 100%;" onclick="registerForEvent(${event.id}, true)" 
                                            ${spotsLeft <= 0 ? 'disabled' : ''}>
                                        ${spotsLeft <= 0 ? 'Event Full' : 'Register for Event'}
                                    </button>` :
                                '<a href="login.html" class="btn btn-primary" style="width: 100%;">Login to Register</a>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Setup event modal interactions
function setupEventModal(modalContainer, event) {
    // Close modal on button click
    modalContainer.querySelector('.close-modal').addEventListener('click', () => {
        modalContainer.classList.remove('show');
        setTimeout(() => modalContainer.remove(), 300);
    });
    
    // Close modal on background click
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            modalContainer.classList.remove('show');
            setTimeout(() => modalContainer.remove(), 300);
        }
    });
}

// Register for event
async function registerForEvent(eventId, fromModal = false) {
    if (!isLoggedIn()) {
        showNotification('Please login to register for events', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/register-event.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                event_id: eventId,
                user_id: userId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Successfully registered for the event!');
            
            // Close modal if registering from modal
            if (fromModal) {
                const modal = document.querySelector('.modal-container');
                if (modal) {
                    modal.classList.remove('show');
                    setTimeout(() => modal.remove(), 300);
                }
            }
            
            // Reload events to update spots
            if (window.location.pathname.includes('events.html')) {
                loadAllEvents();
            }
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        handleApiError(error);
    }
}