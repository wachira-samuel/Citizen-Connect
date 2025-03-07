/**
 * auth.js - Authentication functions for CivicConnect platform
 */

// Authentication state
const AuthState = {
  token: localStorage.getItem('authToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  tokenExpiry: localStorage.getItem('tokenExpiry'),
  pendingRequests: []
};

/**
 * Initialize authentication
 */
function initializeAuth() {
  // Add event listeners to auth forms
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);

    // Add password strength meter
    const passwordInput = document.getElementById('registerPassword');
    if (passwordInput) {
      passwordInput.addEventListener('input', updatePasswordStrength);
    }
  }

  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', handleForgotPassword);
  }

  const resetPasswordForm = document.getElementById('resetPasswordForm');
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', handleResetPassword);
  }

  // Add event listeners to logout buttons
  const logoutButtons = document.querySelectorAll('#logoutBtn, #dashboardLogoutBtn');
  logoutButtons.forEach(button => {
    if (button) {
      button.addEventListener('click', handleLogout);
    }
  });
}

/**
 * Check authentication status
 */
async function checkAuthStatus() {
  // Check if token exists and is not expired
  if (AuthState.token && AuthState.tokenExpiry) {
    const now = Date.now();
    const expiry = parseInt(AuthState.tokenExpiry);

    if (now < expiry) {
      try {
        // Verify token with server
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${AuthState.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();

          // Update app state with user data
          window.App.state.currentUser = data.user;
          window.App.state.isAuthenticated = true;

          // Update UI
          window.App.updateAuthUI();

          // Load user-specific data if on dashboard
          if (document.querySelector('.dashboard-layout')) {
            loadDashboardData();
          }

          return true;
        } else {
          // Token invalid, try refresh
          return refreshAuthToken();
        }
      } catch (error) {
        console.error('Error verifying authentication:', error);
        logout();
        return false;
      }
    } else {
      // Token expired, try refresh
      return refreshAuthToken();
    }
  } else {
    // No token
    window.App.state.isAuthenticated = false;
    window.App.state.currentUser = null;
    window.App.updateAuthUI();
    return false;
  }
}

/**
 * Refresh authentication token
 */
async function refreshAuthToken() {
  if (!AuthState.refreshToken) {
    logout();
    return false;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken: AuthState.refreshToken
      })
    });

    if (response.ok) {
      const data = await response.json();

      // Update tokens
      AuthState.token = data.token;
      AuthState.refreshToken = data.refreshToken;
      AuthState.tokenExpiry = Date.now() + (data.expiresIn * 1000);

      // Save to localStorage
      localStorage.setItem('authToken', AuthState.token);
      localStorage.setItem('refreshToken', AuthState.refreshToken);
      localStorage.setItem('tokenExpiry', AuthState.tokenExpiry);

      // Update app state
      window.App.state.currentUser = data.user;
      window.App.state.isAuthenticated = true;

      // Update UI
      window.App.updateAuthUI();

      // Process any pending requests
      processPendingRequests();

      return true;
    } else {
      // Refresh failed
      logout();
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    logout();
    return false;
  }
}

/**
 * Process requests that were pending while refreshing token
 */
function processPendingRequests() {
  AuthState.pendingRequests.forEach(request => {
    request.headers.Authorization = `Bearer ${AuthState.token}`;
    fetch(request.url, request);
  });

  // Clear pending requests
  AuthState.pendingRequests = [];
}

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const role = document.getElementById('loginRole').value;

  try {
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    // Make API request
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, role })
    });

    if (response.ok) {
      const data = await response.json();

      // Save tokens
      AuthState.token = data.token;
      AuthState.refreshToken = data.refreshToken;
      AuthState.tokenExpiry = Date.now() + (data.expiresIn * 1000);

      // Save to localStorage
      localStorage.setItem('authToken', AuthState.token);
      localStorage.setItem('refreshToken', AuthState.refreshToken);
      localStorage.setItem('tokenExpiry', AuthState.tokenExpiry);

      // Update app state
      window.App.state.currentUser = data.user;
      window.App.state.isAuthenticated = true;

      // Update UI
      window.App.updateAuthUI();

      // Close modal
      window.App.hideModal('loginModal');

      // Show success message
      window.App.showMessage('Login successful! Welcome back.', 'success');

      // Redirect to dashboard if not already there
      if (!document.querySelector('.dashboard-layout')) {
        window.location.href = '/dashboard.html';
      } else {
        // Reload dashboard data
        loadDashboardData();
      }
    } else {
      const errorData = await response.json();
      window.App.showMessage(errorData.message || 'Login failed. Please check your credentials.', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    window.App.showMessage('An error occurred during login. Please try again.', 'error');
  } finally {
    // Reset button state
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

/**
 * Handle registration form submission
 * @param {Event} e - Form submit event
 */
async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const role = document.getElementById('registerRole').value;

  // Validate passwords match
  if (password !== confirmPassword) {
    window.App.showMessage('Passwords do not match.', 'error');
    return;
  }

  try {
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';

    // Make API request
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password, role })
    });

    if (response.ok) {
      const data = await response.json();

      // Close modal
      window.App.hideModal('registerModal');

      // Show success message
      window.App.showMessage('Registration successful! Please check your email to verify your account.', 'success');

      // Show login modal
      setTimeout(() => {
        window.App.showModal('loginModal');
      }, 1500);
    } else {
      const errorData = await response.json();
      window.App.showMessage(errorData.message || 'Registration failed. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Registration error:', error);
    window.App.showMessage('An error occurred during registration. Please try again.', 'error');
  } finally {
    // Reset button state
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

/**
 * Handle forgot password form submission
 * @param {Event} e - Form submit event
 */
async function handleForgotPassword(e) {
  e.preventDefault();

  const email = document.getElementById('forgotEmail').value;

  try {
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    // Make API request
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (response.ok) {
      // Close modal
      window.App.hideModal('forgotPasswordModal');

      // Show success message
      window.App.showMessage('Password reset instructions have been sent to your email.', 'success');
    } else {
      const errorData = await response.json();
      window.App.showMessage(errorData.message || 'Failed to send reset email. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    window.App.showMessage('An error occurred. Please try again.', 'error');
  } finally {
    // Reset button state
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

/**
 * Handle reset password form submission
 * @param {Event} e - Form submit event
 */
async function handleResetPassword(e) {
  e.preventDefault();

  const password = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    window.App.showMessage('Invalid or missing reset token.', 'error');
    return;
  }

  // Validate passwords match
  if (password !== confirmPassword) {
    window.App.showMessage('Passwords do not match.', 'error');
    return;
  }

  try {
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

    // Make API request
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token, password })
    });

    if (response.ok) {
      // Show success message
      window.App.showMessage('Password reset successful! You can now login with your new password.', 'success');

      // Redirect to login page
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2000);
    } else {
      const errorData = await response.json();
      window.App.showMessage(errorData.message || 'Failed to reset password. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Reset password error:', error);
    window.App.showMessage('An error occurred. Please try again.', 'error');
  } finally {
    // Reset button state
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

/**
 * Handle logout
 */
function handleLogout() {
  logout();

  // Show success message
  window.App.showMessage('You have been successfully logged out.', 'success');

  // Redirect to home if on dashboard
  if (document.querySelector('.dashboard-layout')) {
    window.location.href = '/index.html';
  }
}

/**
 * Logout user and clear auth data
 */
function logout() {
  // Clear auth state
  AuthState.token = null;
  AuthState.refreshToken = null;
  AuthState.tokenExpiry = null;

  // Clear localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');

  // Update app state
  window.App.state.isAuthenticated = false;
  window.App.state.currentUser = null;

  // Update UI
  window.App.updateAuthUI();
}

/**
 * Update password strength meter
 */
function updatePasswordStrength() {
  const password = document.getElementById('registerPassword').value;
  const strengthMeter = document.querySelector('.password-strength-meter');
  const feedback = document.querySelector('.password-feedback');

  if (!strengthMeter || !feedback) return;

  // Calculate password strength
  let strength = 0;

  // Length check
  if (password.length >= 8) strength += 1;

  // Contains lowercase
  if (/[a-z]/.test(password)) strength += 1;

  // Contains uppercase
  if (/[A-Z]/.test(password)) strength += 1;

  // Contains number
  if (/[0-9]/.test(password)) strength += 1;

  // Contains special character
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  // Update meter and feedback
  strengthMeter.className = 'password-strength-meter';

  if (password.length === 0) {
    strengthMeter.style.width = '0';
    feedback.textContent = '';
  } else if (strength < 2) {
    strengthMeter.classList.add('strength-weak');
    feedback.textContent = 'Weak password';
  } else if (strength < 4) {
    strengthMeter.classList.add('strength-medium');
    feedback.textContent = 'Medium strength password';
  } else if (strength < 5) {
    strengthMeter.classList.add('strength-good');
    feedback.textContent = 'Good password';
  } else {
    strengthMeter.classList.add('strength-strong');
    feedback.textContent = 'Strong password';
  }
}

/**
 * Make authenticated API request
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
async function authenticatedFetch(url, options = {}) {
  // Check if token is expired
  if (AuthState.tokenExpiry && Date.now() > parseInt(AuthState.tokenExpiry)) {
    // Try to refresh token
    const refreshed = await refreshAuthToken();
    if (!refreshed) {
      // Refresh failed, redirect to login
      logout();
      window.App.showMessage('Your session has expired. Please login again.', 'info');

      if (document.querySelector('.dashboard-layout')) {
        window.location.href = '/login.html';
      }

      return Promise.reject(new Error('Authentication required'));
    }
  }

  // Set up headers
  if (!options.headers) {
    options.headers = {};

  }
}
