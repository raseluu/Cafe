// ===== Mobile Menu Toggle =====
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('show');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('show');
    }
  });

  // Close menu when clicking on a link
  const navItems = navLinks.querySelectorAll('a');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navLinks.classList.remove('show');
    });
  });
}

// ===== Check Login Status =====
function checkLoginStatus() {
  fetch('backend/includes/check_auth.php')
    .then(response => response.json())
    .then(data => {
      const loginBtn = document.getElementById('loginBtn');
      if (loginBtn) {
        if (data.loggedIn) {
          // User is logged in - change button to Dashboard
          loginBtn.innerHTML = '<i class="fas fa-user-circle"></i> Dashboard';
          loginBtn.href = 'dashboard.html';
          loginBtn.onclick = null;
        }
      }
    })
    .catch(error => {
      console.error('Auth check failed:', error);
    });
}

// Check login status on page load
checkLoginStatus();

// ===== Modal Functionality =====

// Get modals
const authModal = document.getElementById('authModal');
const eventModal = document.getElementById('eventModal');

// Get buttons that open modals
const loginBtns = document.querySelectorAll('#loginBtn, #heroLoginBtn');
const joinBtns = document.querySelectorAll('#joinMembershipBtn');
const eventRegisterBtns = document.querySelectorAll('.event-register-btn');

// Get close buttons
const closeModalBtns = document.querySelectorAll('.close-modal');

// Prevent body scroll when modal is open
function disableBodyScroll() {
  document.body.style.overflow = 'hidden';
}

function enableBodyScroll() {
  document.body.style.overflow = '';
}

// Open Auth Modal (Login Tab)
loginBtns.forEach(btn => {
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Check if button is dashboard link
      if (btn.href && btn.href.includes('dashboard.html')) {
        return; // Let it navigate normally
      }
      if (authModal) {
        authModal.classList.add('show');
        authModal.scrollTop = 0;
        showTab('login');
        disableBodyScroll();
      }
    });
  }
});

// Open Auth Modal (Register Tab)
joinBtns.forEach(btn => {
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (authModal) {
        authModal.classList.add('show');
        authModal.scrollTop = 0;
        showTab('register');
        disableBodyScroll();
      }
    });
  }
});

// Open Event Modal
eventRegisterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (eventModal) {
      const eventName = btn.getAttribute('data-event');
      const eventInput = document.getElementById('eventSelect');
      if (eventInput) {
        eventInput.value = eventName;
      }
      eventModal.classList.add('show');
      eventModal.scrollTop = 0;
      disableBodyScroll();
    }
  });
});

// Close modals
closeModalBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (authModal) {
      authModal.classList.remove('show');
    }
    if (eventModal) {
      eventModal.classList.remove('show');
    }
    enableBodyScroll();
  });
});

// Close modal when clicking outside (on the dark overlay)
window.addEventListener('click', (e) => {
  if (e.target === authModal) {
    authModal.classList.remove('show');
    enableBodyScroll();
  }
  if (e.target === eventModal) {
    eventModal.classList.remove('show');
    enableBodyScroll();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (authModal && authModal.classList.contains('show')) {
      authModal.classList.remove('show');
      enableBodyScroll();
    }
    if (eventModal && eventModal.classList.contains('show')) {
      eventModal.classList.remove('show');
      enableBodyScroll();
    }
  }
});

// Modal Tab Switching
const modalTabs = document.querySelectorAll('.modal-tab');
modalTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.getAttribute('data-tab');
    showTab(tabName);
    if (authModal) {
      authModal.scrollTop = 0;
    }
  });
});

function showTab(tabName) {
  const tabContents = document.querySelectorAll('.modal-tab-content');
  tabContents.forEach(content => {
    content.classList.remove('active');
  });

  modalTabs.forEach(tab => {
    tab.classList.remove('active');
  });

  const selectedTab = document.getElementById(tabName + 'Tab');
  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  const selectedTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (selectedTabBtn) {
    selectedTabBtn.classList.add('active');
  }
}

// ===== Back to Top Button =====
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

// ===== Scroll Reveal Animation =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

const animatedElements = document.querySelectorAll('.card, .benefit-card, .testimonial-card, .info-card, .menu-card');
animatedElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
  observer.observe(el);
});

// ===== Book Filter Functionality =====
const filterButtons = document.querySelectorAll('.filter-btn');
const bookCards = document.querySelectorAll('.books-grid .card');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const filterValue = button.getAttribute('data-filter');

    bookCards.forEach(card => {
      if (filterValue === 'all') {
        card.style.display = 'block';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 100);
      } else {
        const categories = card.getAttribute('data-category');
        if (categories && categories.includes(filterValue)) {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 100);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(30px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      }
    });
  });
});

// ===== Form Validation Functions =====
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[\d\s\-\+\(\)]+$/;

function validateEmail(email) {
  return emailRegex.test(email);
}

function validatePhone(phone) {
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

function showError(inputId, errorId, message) {
  const errorElement = document.getElementById(errorId);
  const inputElement = document.getElementById(inputId);
  if (errorElement && inputElement) {
    errorElement.textContent = message;
    inputElement.style.borderColor = '#e74c3c';
  }
}

function clearError(inputId, errorId) {
  const errorElement = document.getElementById(errorId);
  const inputElement = document.getElementById(inputId);
  if (errorElement && inputElement) {
    errorElement.textContent = '';
    inputElement.style.borderColor = '#e0d5cc';
  }
}

// ===== BACKEND INTEGRATION - Register Form =====
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isValid = true;
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    // Client-side validation
    if (name === '' || name.length < 3) {
      showError('regName', 'regNameError', 'Please enter a valid name');
      isValid = false;
    } else {
      clearError('regName', 'regNameError');
    }

    if (!validateEmail(email)) {
      showError('regEmail', 'regEmailError', 'Please enter a valid email address');
      isValid = false;
    } else {
      clearError('regEmail', 'regEmailError');
    }

    if (!validatePhone(phone)) {
      showError('regPhone', 'regPhoneError', 'Please enter a valid phone number');
      isValid = false;
    } else {
      clearError('regPhone', 'regPhoneError');
    }

    if (password.length < 8) {
      showError('regPassword', 'regPasswordError', 'Password must be at least 8 characters');
      isValid = false;
    } else {
      clearError('regPassword', 'regPasswordError');
    }

    if (password !== confirmPassword) {
      showError('regConfirmPassword', 'regConfirmPasswordError', 'Passwords do not match');
      isValid = false;
    } else {
      clearError('regConfirmPassword', 'regConfirmPasswordError');
    }

    if (isValid) {
      // Send to backend
      fetch('backend/includes/register.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, phone, password, confirmPassword })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('🎉 ' + data.message);
          registerForm.reset();
          showTab('login'); // Switch to login tab
        } else {
          alert('❌ ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('❌ Registration failed. Please try again.');
      });
    }
  });
}

// ===== BACKEND INTEGRATION - Login Form =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isValid = true;
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!validateEmail(email)) {
      showError('loginEmail', 'loginEmailError', 'Please enter a valid email address');
      isValid = false;
    } else {
      clearError('loginEmail', 'loginEmailError');
    }

    if (password === '') {
      showError('loginPassword', 'loginPasswordError', 'Please enter your password');
      isValid = false;
    } else {
      clearError('loginPassword', 'loginPasswordError');
    }

    if (isValid) {
      // Send to backend
      fetch('backend/includes/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('✅ ' + data.message);
          loginForm.reset();
          if (authModal) authModal.classList.remove('show');
          enableBodyScroll();
          // Redirect to dashboard
          window.location.href = 'dashboard.html';
        } else {
          alert('❌ ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('❌ Login failed. Please try again.');
      });
    }
  });
}

// ===== BACKEND INTEGRATION - Event Registration Form =====
const eventRegistrationForm = document.getElementById('eventRegistrationForm');
if (eventRegistrationForm) {
  eventRegistrationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isValid = true;
    const name = document.getElementById('eventName').value.trim();
    const email = document.getElementById('eventEmail').value.trim();
    const phone = document.getElementById('eventPhone').value.trim();
    const eventName = document.getElementById('eventSelect').value;
    const guests = document.getElementById('eventGuests').value;

    if (name === '' || name.length < 3) {
      showError('eventName', 'eventNameError', 'Please enter a valid name');
      isValid = false;
    } else {
      clearError('eventName', 'eventNameError');
    }

    if (!validateEmail(email)) {
      showError('eventEmail', 'eventEmailError', 'Please enter a valid email address');
      isValid = false;
    } else {
      clearError('eventEmail', 'eventEmailError');
    }

    if (!validatePhone(phone)) {
      showError('eventPhone', 'eventPhoneError', 'Please enter a valid phone number');
      isValid = false;
    } else {
      clearError('eventPhone', 'eventPhoneError');
    }

    if (isValid) {
      // Extract event ID from event name (you'll need to modify this based on your data)
      // For now, we'll use a simple approach - you should improve this
      let eventId = 1; // Default
      
      // Send to backend
      fetch('backend/includes/event_register.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, phone, eventId, guests })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('✅ ' + data.message);
          eventRegistrationForm.reset();
          if (eventModal) eventModal.classList.remove('show');
          enableBodyScroll();
        } else {
          alert('❌ ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('❌ Registration failed. Please try again.');
      });
    }
  });
}

// ===== BACKEND INTEGRATION - Contact Form =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isValid = true;
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value.trim();

    if (name === '' || name.length < 3) {
      showError('contactName', 'contactNameError', 'Please enter a valid name');
      isValid = false;
    } else {
      clearError('contactName', 'contactNameError');
    }

    if (!validateEmail(email)) {
      showError('contactEmail', 'contactEmailError', 'Please enter a valid email address');
      isValid = false;
    } else {
      clearError('contactEmail', 'contactEmailError');
    }

    if (subject === '') {
      showError('contactSubject', 'contactSubjectError', 'Please select a subject');
      isValid = false;
    } else {
      clearError('contactSubject', 'contactSubjectError');
    }

    if (message === '' || message.length < 10) {
      showError('contactMessage', 'contactMessageError', 'Please enter a message (at least 10 characters)');
      isValid = false;
    } else {
      clearError('contactMessage', 'contactMessageError');
    }

    if (isValid) {
      // Send to backend
      fetch('backend/includes/contact_form.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, phone, subject, message })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('📧 ' + data.message);
          contactForm.reset();
        } else {
          alert('❌ ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('❌ Failed to send message. Please try again.');
      });
    }
  });
}

// ===== Active Page Highlight in Navigation =====
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const navLinksAll = document.querySelectorAll('.nav-links a');

navLinksAll.forEach(link => {
  const linkPage = link.getAttribute('href');
  if (linkPage === currentPage) {
    link.classList.add('active');
  }
});

// ===== Page Load Animation =====
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.5s ease-in';
    document.body.style.opacity = '1';
  }, 100);
});

// ===== Console Welcome Message =====
console.log('%c Welcome to Aesthete Book Café! ', 'background: #9c6b46; color: #fff; font-size: 20px; padding: 10px; border-radius: 5px;');
console.log('%c Where Books Meet The Soul ✨📚☕ ', 'color: #9c6b46; font-size: 16px; font-style: italic;');