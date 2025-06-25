// Authentication JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    
    // Toggle password visibility
    window.togglePassword = function() {
        const passwordField = document.getElementById('password') || document.getElementById('admin_password');
        const toggleBtn = document.querySelector('.toggle-password');
        const icon = toggleBtn.querySelector('i');
        
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            passwordField.type = 'password';
            icon.className = 'fas fa-eye';
        }
    };

    // Form validation and submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Show loading state
            submitBtn.innerHTML = '<i class="spinner"></i> Signing in...';
            submitBtn.disabled = true;
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Validate form
            if (!data.student_id && !data.admin_username) {
                showError('Please enter your student ID or username');
                resetButton();
                return;
            }
            
            if (!data.password && !data.admin_password) {
                showError('Please enter your password');
                resetButton();
                return;
            }
            
            // Simulate API call
            setTimeout(() => {
                // For demo purposes, accept any credentials
                if (data.student_id || data.admin_username) {
                    showSuccess('Login successful! Redirecting...');
                    setTimeout(() => {
                        if (data.student_id) {
                            window.location.href = 'dashboard.html';
                        } else {
                            window.location.href = 'admin-dashboard.html';
                        }
                    }, 1500);
                } else {
                    showError('Invalid credentials. Please try again.');
                    resetButton();
                }
            }, 2000);
            
            function resetButton() {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Input focus effects
    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.borderColor = 'var(--primary-color)';
            this.parentElement.style.boxShadow = '0 0 0 3px var(--primary-light)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.borderColor = 'var(--gray-300)';
            this.parentElement.style.boxShadow = 'none';
        });
        
        // Real-time validation
        input.addEventListener('input', function() {
            validateField(this);
        });
    });
    
    // Field validation
    function validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        
        // Remove previous error styling
        field.classList.remove('error');
        
        switch(fieldName) {
            case 'student_id':
                if (value && !/^[A-Za-z0-9]{6,12}$/.test(value)) {
                    showFieldError(field, 'Student ID should be 6-12 alphanumeric characters');
                    return false;
                }
                break;
            case 'password':
            case 'admin_password':
                if (value && value.length < 6) {
                    showFieldError(field, 'Password should be at least 6 characters');
                    return false;
                }
                break;
        }
        
        clearFieldError(field);
        return true;
    }
    
    function showFieldError(field, message) {
        field.classList.add('error');
        let errorElement = field.parentElement.nextElementSibling;
        
        if (!errorElement || !errorElement.classList.contains('field-error')) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.style.cssText = `
                color: var(--error-color);
                font-size: var(--font-size-sm);
                margin-top: 0.25rem;
            `;
            field.parentElement.after(errorElement);
        }
        
        errorElement.textContent = message;
    }
    
    function clearFieldError(field) {
        const errorElement = field.parentElement.nextElementSibling;
        if (errorElement && errorElement.classList.contains('field-error')) {
            errorElement.remove();
        }
    }
    
    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;
        
        switch(type) {
            case 'success':
                notification.style.background = 'var(--success-color)';
                break;
            case 'error':
                notification.style.background = 'var(--error-color)';
                break;
            default:
                notification.style.background = 'var(--primary-color)';
        }
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    function showSuccess(message) {
        showNotification(message, 'success');
    }
    
    function showError(message) {
        showNotification(message, 'error');
    }
    
    // Remember me functionality
    const rememberCheckbox = document.querySelector('input[name="remember"]');
    if (rememberCheckbox) {
        // Load saved credentials
        const savedCredentials = localStorage.getItem('votedu_saved_credentials');
        if (savedCredentials) {
            const credentials = JSON.parse(savedCredentials);
            const studentIdField = document.getElementById('student_id');
            if (studentIdField && credentials.student_id) {
                studentIdField.value = credentials.student_id;
                rememberCheckbox.checked = true;
            }
        }
        
        // Save credentials on form submit
        if (loginForm) {
            loginForm.addEventListener('submit', function() {
                if (rememberCheckbox.checked) {
                    const formData = new FormData(this);
                    const credentials = {
                        student_id: formData.get('student_id'),
                        timestamp: Date.now()
                    };
                    localStorage.setItem('votedu_saved_credentials', JSON.stringify(credentials));
                } else {
                    localStorage.removeItem('votedu_saved_credentials');
                }
            });
        }
    }
    
    // Auto-focus first input
    const firstInput = document.querySelector('.auth-form input');
    if (firstInput) {
        firstInput.focus();
    }
    
    // Add CSS for error states
    const style = document.createElement('style');
    style.textContent = `
        .input-group input.error {
            border-color: var(--error-color) !important;
            box-shadow: 0 0 0 3px var(--error-light) !important;
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(100%); }
        }
        
        .auth-form {
            animation: fadeIn 0.5s ease-out;
        }
        
        .feature-highlights .highlight {
            animation: slideIn 0.5s ease-out;
            animation-fill-mode: both;
        }
        
        .feature-highlights .highlight:nth-child(1) { animation-delay: 0.1s; }
        .feature-highlights .highlight:nth-child(2) { animation-delay: 0.2s; }
        .feature-highlights .highlight:nth-child(3) { animation-delay: 0.3s; }
    `;
    document.head.appendChild(style);
    
    console.log('Authentication system initialized');
});