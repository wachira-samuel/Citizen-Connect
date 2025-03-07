/**
 * navigation.js - Navigation functionality for CivicConnect platform
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize navigation
  initializeNavigation();

  // Check authentication status to update UI
  checkAuthStatus();
});

/**
* Initialize navigation functionality
*/
function initializeNavigation() {
  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', function() {
          this.classList.toggle('mobile-menu-open');

          // Toggle menu visibility
          if (this.classList.contains('mobile-menu-open')) {
              navMenu.style.maxHeight = navMenu.scrollHeight + 'px';
          } else {
              navMenu.style.maxHeight = '0';
          }
      });
  }

  // Close mobile menu when clicking a link
  const navLinks = document.querySelectorAll('.nav-menu a');
  navLinks.forEach(link => {
      link.addEventListener('click', function() {
          if (window.innerWidth <= 768) {
              mobileMenuToggle.classList.remove('mobile-menu-open');
              navMenu.style.maxHeight = '0';
          }
      });
  });

  // Highlight current page in navigation
  highlightCurrentPage();

  // User menu dropdown toggle
  const userMenuToggle = document.querySelector('.user-menu-toggle');
  const userMenu = document.getElementById('userMenu');

  if (userMenuToggle && userMenu) {
      userMenuToggle.addEventListener('click', function(e) {
          e.stopPropagation();
          userMenu.classList.toggle('open');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {
          if (!userMenu.contains(e.target)) {
              userMenu.classList.remove('open');
          }
      });
  }

  // Add event listeners to auth buttons
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (loginBtn) {
      loginBtn.addEventListener('click', function() {
          window.location.href = 'login.html';
      });
  }

  if (registerBtn) {
      registerBtn.addEventListener('click', function() {
          window.location.href = 'register.html';
      });
  }

  if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
          e.preventDefault();
          handleLogout();
      });
  }

  // Responsive behavior for window resize
  window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
          navMenu.style.maxHeight = '';
          if (mobileMenuToggle) {
              mobileMenuToggle.classList.remove('mobile-menu-open');
          }
      }
  });
}

/**
* Highlight the current page in navigation
*/
function highlightCurrentPage() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-menu a');

  navLinks.forEach(link => {
      // Remove active class from all links
      link.classList.remove('active');

      // Get the href attribute
      const href = link.getAttribute('href');

      // Check if this link corresponds to the current page
      if (href === currentPage) {
          link.classList.add('active');
      }
  });
}

/**
* Check authentication status and update UI accordingly
*/
function checkAuthStatus() {
  // Check if user is logged in (e.g., by checking localStorage or a cookie)
  const authToken = localStorage.getItem('authToken');
  const userName = localStorage.getItem('userName');
  const userAvatar = localStorage.getItem('userAvatar');

  const authButtons = document.querySelector('.auth-buttons');
  const userMenu = document.getElementById('userMenu');

  if (authToken && authButtons && userMenu) {
      // User is logged in, show user menu and hide auth buttons
      authButtons.classList.add('hidden');
      userMenu.classList.remove('hidden');

      // Update user name and avatar
      const userNameElement = document.getElementById('userName');
      const userAvatarElement = document.getElementById('userAvatar');

      if (userNameElement && userName) {
          userNameElement.textContent = userName;
      }

      if (userAvatarElement && userAvatar) {
          userAvatarElement.src = userAvatar;
      }
  } else if (authButtons && userMenu) {
      // User is not logged in, show auth buttons and hide user menu
      authButtons.classList.remove('hidden');
      userMenu.classList.add('hidden');
  }
}

/**
* Handle logout action
*/
function handleLogout() {
  // Clear authentication data
  localStorage.removeItem('authToken');
  localStorage.removeItem('userName');
  localStorage.removeItem('userAvatar');

  // Show success message
  showMessage('You have been successfully logged out.', 'success');

  // Update UI
  checkAuthStatus();

  // Redirect to home page after a short delay
  setTimeout(() => {
      window.location.href = 'index.html';
  }, 1500);
}

/**
* Show notification message
* @param {string} message - Message to display
* @param {string} type - Type of message (success, error, info, warning)
*/
function showMessage(message, type = 'info') {
  // Create message container if it doesn't exist
  let container = document.getElementById('messageContainer');

  if (!container) {
      container = document.createElement('div');
      container.id = 'messageContainer';
      container.className = 'message-container';
      document.body.appendChild(container);
  }

  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = `message message-${type}`;

  // Add message content
  messageElement.innerHTML = `
      <span>${message}</span>
      <button class="message-close">&times;</button>
  `;

  // Add to container
  container.appendChild(messageElement);

  // Add event listener to close button
  const closeButton = messageElement.querySelector('.message-close');
  closeButton.addEventListener('click', () => {
      removeMessage(messageElement);
  });

  // Automatically remove after 5 seconds
  setTimeout(() => {
      removeMessage(messageElement);
  }, 5000);
}

/**
* Remove message element with animation
* @param {HTMLElement} messageElement - Message element to remove
*/
function removeMessage(messageElement) {
  messageElement.style.opacity = '0';
  messageElement.style.transform = 'translateX(100%)';

  setTimeout(() => {
      messageElement.remove();
  }, 300);
}

// Add CSS for messages if not already in the main CSS file
(function() {
  const style = document.createElement('style');
  style.textContent = `
      .message-container {
          position: fixed;
          top: 20px;
          right: 20px;
          max-width: 350px;
          z-index: 1000;
      }

      .message {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          margin-bottom: 10px;
          padding: 15px;
          opacity: 1;
          transform: translateX(0);
          transition: all 0.3s ease;
      }

      .message-success {
          border-left: 4px solid #34c759;
      }

      .message-error {
          border-left: 4px solid #ff3b30;
      }

      .message-info {
          border-left: 4px solid #5ac8fa;
      }

      .message-warning {
          border-left: 4px solid #ffcc00;
      }

      .message-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 20px;
          color: #999;
          margin-left: 10px;
      }
  `;
  document.head.appendChild(style);
})();
