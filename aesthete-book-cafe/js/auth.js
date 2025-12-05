// Authentication functions

// Register user
async function registerUser() {
    const form = document.getElementById('registerForm');
    if (!form) return;
    
    // Get form data
    const formData = {
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        fullName: document.getElementById('fullName')?.value.trim() || '',
        phone: document.getElementById('phone')?.value.trim() || ''
    };
    
    // Validation
    let isValid = true;
    
    // Clear previous errors
    document.querySelectorAll('.error').forEach(el => el.textContent = '');
    
    // Username validation
    if (formData.username.length < 3) {
        document.getElementById('usernameError').textContent = 'Username must be at least 3 characters';
        isValid = false;
    }
    
    // Email validation
    if (!validateEmail(formData.email)) {
        document.getElementById('emailError').textContent = 'Please enter a valid email address';
        isValid = false;
    }
    
    // Password validation
    if (formData.password.length < 6) {
        document.getElementById('passwordError').textContent = 'Password must be at least 6 characters';
        isValid = false;
    }
    
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
        document.getElementById('passwordError').textContent = 'Passwords do not match';
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Show loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitText = document.getElementById('submitText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    submitText.style.display = 'none';
    loadingSpinner.style.display = 'inline';
    submitBtn.disabled = true;
    
    try {
        // Remove confirmPassword before sending
        delete formData.confirmPassword;
        
        const response = await fetch(`${API_BASE_URL}/auth/register.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message);
            
            // Clear form
            form.reset();
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        handleApiError(error);
    } finally {
        // Reset button state
        submitText.style.display = 'inline';
        loadingSpinner.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Login user
async function loginUser() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    const formData = {
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value
    };
    
    // Validation
    if (!formData.email || !formData.password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (!validateEmail(formData.email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Save user data to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('email', data.user.email);
            localStorage.setItem('isAdmin', data.user.is_admin);
            
            showNotification('Login successful!');
            
            // Redirect based on user type
            setTimeout(() => {
                if (data.user.is_admin) {
                    window.location.href = 'admin/index.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1500);
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        handleApiError(error);
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Verify email from URL token
async function verifyEmail() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showNotification('Invalid verification link', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email.php?token=${token}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('verificationResult').innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-check-circle" style="font-size: 48px; color: #4CAF50;"></i>
                    <h2>Email Verified Successfully!</h2>
                    <p>Your email has been verified. You can now login to your account.</p>
                    <a href="login.html" class="btn btn-primary" style="margin-top: 20px;">Go to Login</a>
                </div>
            `;
        } else {
            document.getElementById('verificationResult').innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-times-circle" style="font-size: 48px; color: #f44336;"></i>
                    <h2>Verification Failed</h2>
                    <p>${data.message || 'The verification link is invalid or has expired.'}</p>
                    <a href="register.html" class="btn btn-primary" style="margin-top: 20px;">Register Again</a>
                </div>
            `;
        }
    } catch (error) {
        handleApiError(error);
    }
}

// Forgot password
async function forgotPassword() {
    const email = document.getElementById('forgotEmail').value.trim();
    
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = document.querySelector('#forgotPasswordForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Password reset instructions have been sent to your email');
            document.getElementById('forgotPasswordForm').reset();
            
            // Hide form and show success message
            document.getElementById('forgotPasswordForm').style.display = 'none';
            document.getElementById('resetSuccess').style.display = 'block';
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        handleApiError(error);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}