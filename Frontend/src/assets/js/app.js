
// Global state
const AppState = {
  currentUser: null,
  isAuthenticated: false,
  notifications: [],
  isDarkMode: false,
  lastActivity: Date.now()
};

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
  // Initialize components
  initializeUI();
  initializeAuth();
  initializeModals();
  initializeNotifications();
  initializeTestimonials();

  // Check authentication status
  checkAuthStatus();

  // Track user activity
  trackUserActivity();
});

/**
 * Initialize UI components
 */
function initializeUI() {
  // Toggle dark mode if user preference exists
  if (localStorage.getItem('darkMode') === 'true') {
    toggleDarkMode(true);
  }

  // Add event listener for dark mode toggle if it exists
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => toggleDarkMode());
  }

  // Initialize dashboard navigation if on dashboard page
  if (document.querySelector('.dashboard-layout')) {
    initializeDashboardNav();
  }

  // Add event listeners to buttons
  const getStartedBtn = document.getElementById('getStartedBtn');
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      if (AppState.isAuthenticated) {
        window.location.href = '/dashboard.html';
      } else {
        showModal('registerModal');
      }
    });
  }

  const learnMoreBtn = document.getElementById('learnMoreBtn');
  if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', () => {
      document.querySelector('.features').scrollIntoView({ behavior: 'smooth' });
    });
  }
}

/**
 * Initialize modals
 */
function initializeModals() {
  // Get all modal triggers
  const modalTriggers = {
    loginBtn: 'loginModal',
    registerBtn: 'registerModal',
    loginLink: 'loginModal',
    registerLink: 'registerModal',
    forgotPasswordLink: 'forgotPasswordModal',
    createPollBtn: 'createPollModal',
    reportIncidentBtn: 'reportIncidentModal',
    shareOpinionBtn: 'shareOpinionModal'
  };

  // Add event listeners to modal triggers
  Object.keys(modalTriggers).forEach(triggerId => {
    const trigger = document.getElementById(triggerId);
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        showModal(modalTriggers[triggerId]);
      });
    }
  });

  // Add event listeners to close buttons
  const closeButtons = document.querySelectorAll('.close-modal');
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      hideModal(modal.id);
    });
  });

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    const modals = document.querySelectorAll('.modal:not(.hidden)');
    modals.forEach(modal => {
      if (e.target === modal) {
        hideModal(modal.id);
      }
    });
  });
}

/**
 * Show modal by ID
 * @param {string} modalId - ID of the modal to show
 */
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    // Hide any other open modals
    document.querySelectorAll('.modal:not(.hidden)').forEach(m => {
      m.classList.add('hidden');
    });

    // Show the requested modal
    modal.classList.remove('hidden');

    // Focus the first input if it exists
    const firstInput = modal.querySelector('input');
    if (firstInput) {
      firstInput.focus();
    }

    // Disable scrolling on the body
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Hide modal by ID
 * @param {string} modalId - ID of the modal to hide
 */
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');

    // Re-enable scrolling on the body if no other modals are open
    if (document.querySelectorAll('.modal:not(.hidden)').length === 0) {
      document.body.style.overflow = '';
    }
  }
}

/**
 * Initialize testimonial carousel
 */
function initializeTestimonials() {
  const testimonials = document.querySelectorAll('.testimonial');
  if (testimonials.length <= 1) return;

  let currentIndex = 0;

  // Hide all testimonials except the first one
  for (let i = 1; i < testimonials.length; i++) {
    testimonials[i].style.display = 'none';
  }

  // Add event listeners to carousel controls
  const prevButton = document.getElementById('prevTestimonial');
  const nextButton = document.getElementById('nextTestimonial');

  if (prevButton && nextButton) {
    prevButton.addEventListener('click', () => {
      testimonials[currentIndex].style.display = 'none';
      currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
      testimonials[currentIndex].style.display = 'block';
    });

    nextButton.addEventListener('click', () => {
      testimonials[currentIndex].style.display = 'none';
      currentIndex = (currentIndex + 1) % testimonials.length;
      testimonials[currentIndex].style.display = 'block';
    });

    // Auto-rotate testimonials every 5 seconds
    setInterval(() => {
      testimonials[currentIndex].style.display = 'none';
      currentIndex = (currentIndex + 1) % testimonials.length;
      testimonials[currentIndex].style.display = 'block';
    }, 5000);
  }
}

/**
 * Initialize dashboard navigation
 */
function initializeDashboardNav() {
  const navLinks = document.querySelectorAll('.sidebar-nav a');
  const sections = document.querySelectorAll('.dashboard-section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));

      // Add active class to clicked link
      link.classList.add('active');

      // Hide all sections
      sections.forEach(section => section.classList.remove('active'));

      // Show the corresponding section
      const sectionId = link.getAttribute('data-section');
      const section = document.getElementById(sectionId);
      if (section) {
        section.classList.add('active');
      }
    });
  });
}

/**
 * Initialize notification system
 */
function initializeNotifications() {
  // Create notification container if it doesn't exist
  if (!document.getElementById('messageContainer')) {
    const container = document.createElement('div');
    container.id = 'messageContainer';
    container.className = 'message-container';
    document.body.appendChild(container);
  }
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of message (success, error, info, warning)
 * @param {number} duration - Duration in milliseconds to show the message
 */
function showMessage(message, type = 'info', duration = 5000) {
  const container = document.getElementById('messageContainer');

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

  // Automatically remove after duration
  setTimeout(() => {
    removeMessage(messageElement);
  }, duration);
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

/**
 * Toggle dark mode
 * @param {boolean} force - Force dark mode on or off
 */
function toggleDarkMode(force) {
  const isDark = force !== undefined ? force : !AppState.isDarkMode;

  if (isDark) {
    document.body.classList.add('dark-mode');
    AppState.isDarkMode = true;
    localStorage.setItem('darkMode', 'true');
  } else {
    document.body.classList.remove('dark-mode');
    AppState.isDarkMode = false;
    localStorage.setItem('darkMode', 'false');
  }

  // Update toggle button if it exists
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.innerHTML = AppState.isDarkMode ?
      '<i class="fas fa-sun"></i>' :
      '<i class="fas fa-moon"></i>';
  }
}

/**
 * Track user activity for auto-logout
 */
// function trackUserActivity() {
  // Update last activity timestamp on user interaction
  // const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

  // events.forEach(event => {
  //   document.addEventListener(event, () => {
  //     AppState.lastActivity = Date.now();
  //   });
  // });

  // Check for inactivity every minute
  // setInterval(() => {
  //   const inactiveTime = Date.now() - AppState.lastActivity;

    // Auto logout after 30 minutes of inactivity
//     if (AppState.isAuthenticated && inactiveTime > 30 * 60 * 1000) {
//       showMessage('You have been logged out due to inactivity', 'info');
//       logout();
//     }
//   }, 60 * 1000);
// }

/**
 * Update UI based on authentication status
 */
function updateAuthUI() {
  const authButtons = document.querySelector('.auth-buttons');
  const userMenu = document.getElementById('userMenu');
  const userName = document.getElementById('userName');

  if (authButtons && userMenu) {
    if (AppState.isAuthenticated && AppState.currentUser) {
      // Hide auth buttons and show user menu
      document.getElementById('loginBtn')?.classList.add('hidden');
      document.getElementById('registerBtn')?.classList.add('hidden');
      userMenu.classList.remove('hidden');

      // Update user name
      if (userName) {
        userName.textContent = AppState.currentUser.name;
      }

      // Update sidebar user info if on dashboard
      const sidebarUserName = document.getElementById('sidebarUserName');
      const userRole = document.getElementById('userRole');
      const userAvatar = document.getElementById('userAvatar');

      if (sidebarUserName) {
        sidebarUserName.textContent = AppState.currentUser.name;
      }

      if (userRole) {
        userRole.textContent = formatRole(AppState.currentUser.role);
      }

      if (userAvatar && AppState.currentUser.avatar) {
        userAvatar.src = AppState.currentUser.avatar;
      }

      // Show/hide admin-only elements
      const adminElements = document.querySelectorAll('.admin-only');
      const govtElements = document.querySelectorAll('.admin-govt-only');

      if (AppState.currentUser.role === 'admin') {
        adminElements.forEach(el => el.classList.remove('hidden'));
        govtElements.forEach(el => el.classList.remove('hidden'));
      } else if (AppState.currentUser.role === 'govt_official') {
        adminElements.forEach(el => el.classList.add('hidden'));
        govtElements.forEach(el => el.classList.remove('hidden'));
      } else {
        adminElements.forEach(el => el.classList.add('hidden'));
        govtElements.forEach(el => el.classList.add('hidden'));
      }
    } else {
      // Show auth buttons and hide user menu
      document.getElementById('loginBtn')?.classList.remove('hidden');
      document.getElementById('registerBtn')?.classList.remove('hidden');
      userMenu.classList.add('hidden');
    }
  }
}

/**
 * Format role string for display
 * @param {string} role - Role identifier
 * @returns {string} Formatted role name
 */
function formatRole(role) {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'govt_official':
      return 'Government Official';
    case 'citizen':
      return 'Citizen';
    default:
      return role;
  }
}

window.App = {
  state: AppState,
  showModal,
  hideModal,
  showMessage,
  updateAuthUI,
  formatRole
};
