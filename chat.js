// Chat module - handles messaging, users, and chat state

let currentUser = null;
let lastMessageId = 0;
let pollInterval = null;
let usersList = [];
let currentRecipient = null;
let unseenCount = 0;
let currentUserStatus = 'online';
let lastActivity = Date.now();
let heartbeatInterval = null;
let awayTimeout = null;

async function sendMessage(content, recipient_id = null) {
    try {
        const response = await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}/messages`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                content, 
                user_id: currentUser.id, 
                is_guest: currentUser.is_guest || false, 
                recipient_id,
                status: currentUserStatus 
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (data.blocked) {
                // Throw error with the full response data for moderation handling
                const error = new Error(JSON.stringify(data));
                throw error;
            }
            throw new Error(data.error || 'Request failed');
        }
        
        return data.message || { 
            id: Date.now(), 
            display_name: currentUser ? currentUser.username : 'you', 
            username: currentUser ? currentUser.username : 'you', 
            is_guest: currentUser ? currentUser.is_guest : true, 
            content, 
            timestamp: Date.now(),
            status: currentUserStatus 
        };
    } catch (err) {
        // Re-throw the error to be handled by the caller
        throw err;
    }
}

async function fetchMessages() {
    try {
        const response = await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}/messages?last_id=${lastMessageId}`);
        const data = await response.json();
        return data.messages || [];
    } catch (err) {
        console.error('Failed to fetch messages:', err);
        return [];
    }
}

async function fetchRecentMessages() {
    try {
        const response = await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}/messages/recent`);
        const data = await response.json();
        return data.messages || [];
    } catch (err) {
        console.error('Failed to fetch recent messages:', err);
        return [];
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}/users`);
        const data = await response.json();
        usersList = data.users || [];
        populateUserSelect();
    } catch (err) {
        console.error('Failed to load users:', err);
    }
}

async function deleteMessageRequest(messageId) {
    try {
        const response = await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}/messages/${messageId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                requesting_user_id: currentUser && currentUser.id, 
                requesting_username: currentUser && currentUser.username 
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Delete failed');
        return data;
    } catch (err) {
        console.error('Delete message failed:', err);
        throw err;
    }
}

function createMessageElement(message) {
    const d = document.createElement('div');
    d.className = 'message-item fade-in';
    d.dataset.messageId = message.id;
    const isGuest = message.is_guest;
    const avatarChar = isGuest ? 'G' : (message.username && message.username[0] ? message.username[0].toUpperCase() : 'U');
    const avatarColor = isGuest ? 'from-gray-500 to-gray-600' : 'from-blue-500 to-purple-600';
    const ownerBadge = (message.username && message.username.toLowerCase() === 'owner') ? `<i class="fas fa-shield-alt text-white ml-1" title="owner"></i>` : '';
    const dmLabel = (message.recipient_id != null) ? `<span class="dm-badge">DM ${message.recipient_username ? '→ [' + window.escapeHtml(message.recipient_username) + ']' : ''}</span>` : '';
    
    // Status indicator for non-guest users - use current status from usersList
    let currentStatus = 'offline';
    if (!isGuest && message.user_id) {
        const currentUserData = usersList.find(u => u.id === message.user_id);
        currentStatus = currentUserData ? currentUserData.status : 'offline';
    }
    const statusDot = !isGuest ? `<div class="status-dot status-${currentStatus}"></div>` : '';
    
    // Profile picture logic - use profile_picture from message data first
    let avatarHtml;
    if (!isGuest && message.profile_picture) {
        avatarHtml = `<img src="${window.escapeHtml(message.profile_picture)}" alt="Profile" class="w-8 h-8 rounded-full object-cover">`;
    } else if (!isGuest && message.user_id) {
        // Fallback to usersList lookup for older messages without profile_picture field
        const userData = usersList.find(u => u.id === message.user_id);
        if (userData && userData.profile_picture) {
            avatarHtml = `<img src="${window.escapeHtml(userData.profile_picture)}" alt="Profile" class="w-8 h-8 rounded-full object-cover">`;
        } else {
            avatarHtml = `<div class="w-8 h-8 rounded-full bg-gradient-to-r ${avatarColor} flex items-center justify-center text-white text-sm font-medium">${window.escapeHtml(avatarChar)}</div>`;
        }
    } else {
        avatarHtml = `<div class="w-8 h-8 rounded-full bg-gradient-to-r ${avatarColor} flex items-center justify-center text-white text-sm font-medium">${window.escapeHtml(avatarChar)}</div>`;
    }
    
    let deleteButtonHtml = '';
    if (currentUser && !currentUser.is_guest && currentUser.username && currentUser.username.toLowerCase() === 'owner') {
        deleteButtonHtml = `<button data-delete-id="${message.id}" class="ml-3 text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>`;
    }
    
    // Check if message content is a GIF URL
    const isGifMessage = message.content && (message.content.startsWith('http') && (message.content.includes('.gif') || message.content.includes('tenor.com') || message.content.includes('giphy.com')));
    
    let messageContent;
    if (isGifMessage) {
        messageContent = `
            <div class="gif-message">
                <img src="${window.escapeHtml(message.content)}" alt="GIF" loading="lazy">
                <div class="gif-overlay">
                    <i class="fas fa-play"></i> Hover to play
                </div>
            </div>
        `;
    } else {
        messageContent = `<div class="text-gray-300 break-words">${window.escapeHtml(message.content)}</div>`;
    }
    
    d.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="flex-shrink-0 status-indicator">
                ${avatarHtml}
                ${statusDot}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1">
                    <span class="font-medium text-white">${window.escapeHtml(message.display_name)}</span>
                    ${ownerBadge}
                    <span class="ml-2">${dmLabel}</span>
                    ${deleteButtonHtml}
                    <span class="text-xs text-gray-400">${window.formatTime(message.timestamp)}</span>
                </div>
                ${messageContent}
            </div>
        </div>
    `;
    
    const btn = d.querySelector('button[data-delete-id]');
    if (btn) {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = parseInt(btn.getAttribute('data-delete-id'), 10);
            if (!confirm('Delete this message?')) return;
            try {
                await deleteMessageRequest(id);
                removeMessageElement(id);
            } catch (err) {
                window.showError('Failed to delete message');
            }
        });
    }
    
    return d;
}

function removeMessageElement(messageId) {
    const el = document.querySelector(`[data-message-id="${messageId}"]`);
    if (el && el.parentNode) el.parentNode.removeChild(el);
}

function messageMatchesCurrentView(message) {
    if (!currentRecipient) {
        if (message.recipient_id == null) return true;
        if (!currentUser) return false;
        return (message.user_id === currentUser.id) || (message.recipient_id === currentUser.id);
    } else {
        if (!currentUser) return false;
        const a = currentUser.id, b = currentRecipient.id;
        return (message.user_id === a && message.recipient_id === b) || (message.user_id === b && message.recipient_id === a);
    }
}

function clearMessages() {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) messagesContainer.innerHTML = '';
}

function renderMessages(allMessages) {
    clearMessages();
    const messagesContainer = document.getElementById('messages-container');
    const emptyState = document.getElementById('empty-state');
    
    if (!messagesContainer || !emptyState) return;
    
    if (!allMessages || allMessages.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    let anyShown = false;
    allMessages.forEach(message => {
        if (messageMatchesCurrentView(message)) {
            addMessage(message, false);
            anyShown = true;
        }
    });
    
    if (!anyShown) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
    
    window.scrollToBottom();
}

function addMessage(message, scroll = true) {
    const messagesContainer = document.getElementById('messages-container');
    const emptyState = document.getElementById('empty-state');
    
    if (!messagesContainer || !emptyState) return;
    
    if (document.querySelector(`[data-message-id="${message.id}"]`)) return;
    
    if (!messageMatchesCurrentView(message)) {
        if (document.hidden && currentUser) {
            const relevant = (!message.recipient_id) || (message.recipient_id === currentUser.id) || (message.user_id === currentUser.id);
            if (relevant) window.incrementUnread();
        }
        return;
    }
    
    emptyState.classList.add('hidden');
    const messageElement = createMessageElement(message);
    messagesContainer.appendChild(messageElement);
    setTimeout(() => messageElement.classList.add('message-appear'), 10);
    lastMessageId = Math.max(lastMessageId, message.id);
    if (scroll) window.scrollToBottom();
}

function loadMessages() {
    fetchRecentMessages()
        .then(messages => {
            const emptyState = document.getElementById('empty-state');
            if (!emptyState) return;
            
            if (!messages || messages.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                renderMessages(messages);
            }
        })
        .catch(err => console.error('Failed to load messages:', err));
}

function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(() => {
        fetchMessages().then(messages => {
            messages.forEach(m => addMessage(m));
            loadUsers();
        }).catch(err => console.error('Polling error:', err));
    }, 1000);
}

function stopPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}

function populateUserSelect() {
    const userSelect = document.getElementById('user-select');
    if (!userSelect) return;
    
    const prev = userSelect.value || '';
    userSelect.innerHTML = '';
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All (global)';
    userSelect.appendChild(allOption);
    
    usersList.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        
        // Add status indicator to username
        const statusEmoji = {
            'online': '🟢',
            'away': '🟡',
            'busy': '🔴',
            'offline': '⚫'
        };
        const emoji = statusEmoji[u.status] || '⚫';
        opt.textContent = `${emoji} ${u.username}`;
        
        userSelect.appendChild(opt);
    });
    
    if (prev) {
        const found = Array.from(userSelect.options).some(o => o.value === prev);
        if (found) userSelect.value = prev;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        currentUser,
        lastMessageId,
        pollInterval,
        usersList,
        currentRecipient,
        unseenCount,
        currentUserStatus,
        sendMessage,
        fetchMessages,
        fetchRecentMessages,
        loadUsers,
        deleteMessageRequest,
        createMessageElement,
        removeMessageElement,
        messageMatchesCurrentView,
        clearMessages,
        renderMessages,
        addMessage,
        loadMessages,
        startPolling,
        stopPolling,
        populateUserSelect
    };
}
