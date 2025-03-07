/**
 * chat.js - AI chat functions for CivicConnect platform
 */

// Chat state
const ChatState = {
  messages: [],
  isProcessing: false,
  conversationId: null,
  typingTimeout: null,
  aiTypingSpeed: 30, // ms per character
  messageHistory: [],
  suggestedQuestions: [
    "How do I report a pothole?",
    "What are the recycling guidelines?",
    "When is the next city council meeting?",
    "How can I apply for a building permit?",
    "Where can I pay my water bill?"
  ]
};

/**
 * Initialize chat interface
 */
function initializeChat() {
  // Get chat elements
  const chatInterface = document.getElementById('chatInterface');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const chatMessages = document.getElementById('chatMessages');
  const suggestedQuestions = document.getElementById('suggestedQuestions');

  if (!chatInterface) return;

  // Load previous conversation if exists
  loadChatHistory();

  // Add event listener to send button
  if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
  }

  // Add event listener to input for Enter key
  if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Focus input
    messageInput.focus();
  }

  // Render suggested questions
  if (suggestedQuestions) {
    renderSuggestedQuestions();
  }

  // Add event listener for file upload
  const fileUpload = document.getElementById('fileUpload');
  const attachButton = document.getElementById('attachButton');

  if (fileUpload && attachButton) {
    attachButton.addEventListener('click', () => {
      fileUpload.click();
    });

    fileUpload.addEventListener('change', handleFileUpload);
  }

  // Add event listener for voice input
  const voiceButton = document.getElementById('voiceButton');
  if (voiceButton) {
    voiceButton.addEventListener('click', toggleVoiceInput);
  }

  // Add event listener for clear chat
  const clearChatButton = document.getElementById('clearChatButton');
  if (clearChatButton) {
    clearChatButton.addEventListener('click', clearChat);
  }

  // Add event listener for export chat
  const exportChatButton = document.getElementById('exportChatButton');
  if (exportChatButton) {
    exportChatButton.addEventListener('click', exportChat);
  }
}

/**
 * Send message to AI
 */
async function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();

  if (message === '' || ChatState.isProcessing) return;

  // Clear input
  messageInput.value = '';

  // Add user message to chat
  addMessageToChat('user', message);

  // Set processing state
  ChatState.isProcessing = true;
  updateChatStatus('typing');

  try {
    // Send message to API
    const response = await window.Auth.authenticatedFetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        conversationId: ChatState.conversationId
      })
    });

    if (response.ok) {
      const data = await response.json();

      // Update conversation ID
      ChatState.conversationId = data.conversationId;

      // Add AI response to chat with typing effect
      addMessageToChat('ai', data.response, true);

      // Update suggested questions based on context
      if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
        ChatState.suggestedQuestions = data.suggestedQuestions;
        renderSuggestedQuestions();
      }

      // Save chat history
      saveChatHistory();
    } else {
      const errorData = await response.json();
      window.App.showMessage(errorData.message || 'Failed to get a response. Please try again.', 'error');
      updateChatStatus('error');
    }
  } catch (error) {
    console.error('Chat error:', error);
    window.App.showMessage('An error occurred while processing your message. Please try again.', 'error');
    updateChatStatus('error');
  } finally {
    // Reset processing state
    ChatState.isProcessing = false;
  }
}

/**
 * Add message to chat
 * @param {string} sender - Message sender ('user' or 'ai')
 * @param {string} content - Message content
 * @param {boolean} withTypingEffect - Whether to show typing effect for AI messages
 */
function addMessageToChat(sender, content, withTypingEffect = false) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = `chat-message ${sender}-message`;

  // Create avatar
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';

  if (sender === 'user') {
    // Use user avatar if available, otherwise default
    const userAvatar = window.App.state.currentUser?.avatar || '/assets/images/default-avatar.png';
    avatar.innerHTML = `<img src="${userAvatar}" alt="User">`;
  } else {
    // AI avatar
    avatar.innerHTML = `<img src="/assets/images/ai-avatar.png" alt="AI Assistant">`;
  }

  // Create message content
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';

  // Create message bubble
  const messageBubble = document.createElement('div');
  messageBubble.className = 'message-bubble';

  if (withTypingEffect && sender === 'ai') {
    // Add typing indicator initially
    messageBubble.innerHTML = `
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    // Start typing effect after a short delay
    setTimeout(() => {
      startTypingEffect(messageBubble, content);
    }, 500);
  } else {
    // Format message content with Markdown support
    messageBubble.innerHTML = formatMessageContent(content);
  }

  // Create message info (time)
  const messageInfo = document.createElement('div');
  messageInfo.className = 'message-info';
  messageInfo.textContent = formatMessageTime(new Date());

  // Assemble message
  messageContent.appendChild(messageBubble);
  messageContent.appendChild(messageInfo);
  messageElement.appendChild(avatar);
  messageElement.appendChild(messageContent);

  // Add message to chat
  chatMessages.appendChild(messageElement);

  // Scroll to bottom
  scrollToBottom();

  // Add to messages array
  ChatState.messages.push({
    sender,
    content,
    timestamp: new Date()
  });
}

/**
 * Start typing effect for AI messages
 * @param {HTMLElement} element - Element to show typing effect in
 * @param {string} content - Content to type
 */
function startTypingEffect(element, content) {
  // Format the message content
  const formattedContent = formatMessageContent(content);

  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = formattedContent;

  // Extract text content
  const textContent = tempDiv.textContent;

  // Calculate typing duration based on content length
  const typingDuration = Math.min(textContent.length * ChatState.aiTypingSpeed, 5000);

  // Replace typing indicator with empty content
  element.innerHTML = '';

  // Set the final formatted content
  element.innerHTML = formattedContent;

  // Add the 'typing' class to fade in the content
  element.classList.add('typing');

  // Remove the typing class after animation completes
  setTimeout(() => {
    element.classList.remove('typing');
    updateChatStatus('online');

    // Initialize any code blocks if present
    initializeCodeBlocks();
  }, typingDuration);
}

/**
 * Format message content with Markdown support
 * @param {string} content - Raw message content
 * @returns {string} Formatted HTML
 */
function formatMessageContent(content) {
  // Replace URLs with clickable links
  content = content.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Format code blocks
  content = content.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    '<pre><code class="language-$1">$2</code></pre>'
  );

  // Format inline code
  content = content.replace(
    /`([^`]+)`/g,
    '<code>$1</code>'
  );

  // Format bold text
  content = content.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong>$1</strong>'
  );

  // Format italic text
  content = content.replace(
    /\*([^*]+)\*/g,
    '<em>$1</em>'
  );

  // Format lists
  content = content.replace(
    /^\s*-\s+(.+)$/gm,
    '<li>$1</li>'
  ).replace(
    /(<li>.*<\/li>)/s,
    '<ul>$1</ul>'
  );

  // Format paragraphs
  content = content.replace(
    /\n\n/g,
    '</p><p>'
  );

  // Wrap in paragraph if not already
  if (!content.startsWith('<')) {
    content = `<p>${content}</p>`;
  }

  return content;
}

/**
 * Initialize code blocks with syntax highlighting
 */
function initializeCodeBlocks() {
  // Check if highlight.js is available
  if (window.hljs) {
    document.querySelectorAll('pre code').forEach((block) => {
      window.hljs.highlightBlock(block);
    });
  }
}

/**
 * Format message time
 * @param {Date} date - Message timestamp
 * @returns {string} Formatted time
 */
function formatMessageTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

/**
 * Update chat status indicator
 * @param {string} status - Status to show (online, offline, typing, error)
 */
function updateChatStatus(status) {
  const statusIndicator = document.getElementById('chatStatus');
  if (!statusIndicator) return;

  // Remove all status classes
  statusIndicator.classList.remove('status-online', 'status-offline', 'status-typing', 'status-error');

  // Add appropriate class and text
  switch (status) {
    case 'online':
      statusIndicator.classList.add('status-online');
      statusIndicator.textContent = 'Online';
      break;
    case 'offline':
      statusIndicator.classList.add('status-offline');
      statusIndicator.textContent = 'Offline';
      break;
    case 'typing':
      statusIndicator.classList.add('status-typing');
      statusIndicator.textContent = 'Typing...';
      break;
    case 'error':
      statusIndicator.classList.add('status-error');
      statusIndicator.textContent = 'Error';
      break;
    default:
      statusIndicator.classList.add('status-online');
      statusIndicator.textContent = 'Online';
  }
}

/**
 * Render suggested questions
 */
function renderSuggestedQuestions() {
  const container = document.getElementById('suggestedQuestions');
  if (!container) return;

  container.innerHTML = '';

  ChatState.suggestedQuestions.forEach(question => {
    const button = document.createElement('button');
    button.className = 'suggested-question';
    button.textContent = question;

    button.addEventListener('click', () => {
      document.getElementById('messageInput').value = question;
      sendMessage();
    });

    container.appendChild(button);
  });
}

/**
 * Handle file upload
 * @param {Event} e - Change event from file input
 */
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    window.App.showMessage('File is too large. Maximum size is 5MB.', 'error');
    return;
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  }
