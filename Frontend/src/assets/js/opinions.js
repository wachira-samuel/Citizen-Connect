document.addEventListener('DOMContentLoaded', () => {
  // Initialize the opinions page
  initOpinionsPage();
});

function initOpinionsPage() {
  loadOpinions();
  loadTrendingTopics();
  loadCategories();

  
  setupEventListeners();

  // Initialize modals
  initModals();
}

// Load opinions from API
async function loadOpinions(page = 1, filters = {}) {
  const opinionsList = document.getElementById('opinionsList');
  const loadingIndicator = document.getElementById('opinionsLoading');

  try {
      // Show loading indicator
      loadingIndicator.style.display = 'flex';
      opinionsList.innerHTML = '';

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);

      if (filters.category && filters.category !== 'all') {
          queryParams.append('category', filters.category);
      }

      if (filters.sort) {
          queryParams.append('sort', filters.sort);
      }

      if (filters.search) {
          queryParams.append('search', filters.search);
      }

      // Fetch opinions from API
      const response = await fetch(`/api/opinions?${queryParams.toString()}`);

      if (!response.ok) {
          throw new Error('Failed to load opinions');
      }

      const data = await response.json();

      // Hide loading indicator
        }catch(error){
          loadingIndicator.style.display = 'none'

        }
    }



