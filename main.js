
let currentUser = null;
let currentRecipient = null;

// DOM element references
const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const guestBtn = document.getElementById('guest-btn');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');
const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const charCount = document.getElementById('char-count');
const emptyState = document.getElementById('empty-state');
const userSelect = document.getElementById('user-select');
const clearRecipientBtn = document.getElementById('clear-recipient-btn');
const statusSelect = document.getElementById('status-select');
const adminBtn = document.getElementById('admin-btn');

// Modal references
const moderationModal = document.getElementById('moderation-modal');
const moderationReason = document.getElementById('moderation-reason');
const moderationOk = document.getElementById('moderation-ok');
const banModal = document.getElementById('ban-modal');
const banReason = document.getElementById('ban-reason');
const banOk = document.getElementById('ban-ok');

// Status management functions - now handled by status.js module

// Screen management functions
function showAuthScreen() { 
    if (authScreen) authScreen.classList.remove('hidden'); 
    if (chatScreen) chatScreen.classList.add('hidden'); 
    stopHeartbeat();
    currentUser = null; 
    if (window.stopPolling) window.stopPolling(); 
    if (window.markAsSeen) window.markAsSeen();
    if (window.stopHeartbeat) window.stopHeartbeat(); 
}

function showChatScreen(user) {
    currentUser = user;
    if (authScreen) authScreen.classList.add('hidden'); 
    if (chatScreen) chatScreen.classList.remove('hidden');
    
    if (user.is_guest) {
        if (userDisplay) userDisplay.innerHTML = '[guest]';
        if (statusSelect) statusSelect.classList.add('hidden');
        if (adminBtn) adminBtn.classList.add('hidden');
    } else {
        // Load saved status if available
        const savedStatus = localStorage.getItem(`user_status_${user.username}`);
        if (savedStatus && ['online', 'away', 'busy', 'offline'].includes(savedStatus)) {
            currentUserStatus = savedStatus;
        }
        
        if (user.username && user.username.toLowerCase() === 'owner') {
            if (userDisplay) userDisplay.innerHTML = `[${user.username}] <span class="owner-shield">*</span>`;
            if (adminBtn) adminBtn.classList.remove('hidden');
        } else {
            if (userDisplay) userDisplay.textContent = `[${user.username}]`;
            if (adminBtn) adminBtn.classList.add('hidden');
        }
        if (statusSelect) {
            statusSelect.classList.remove('hidden');
            statusSelect.value = currentUserStatus;
        }
        
        // Start status tracking
        if (window.startHeartbeat) window.startHeartbeat();
        if (window.resetAwayTimer) window.resetAwayTimer();
    }
    
    if (window.loadUsers) window.loadUsers(); 
    if (window.loadMessages) window.loadMessages(); 
    if (window.startPolling) window.startPolling(); 
    if (messageInput) messageInput.focus(); 
    if (window.markAsSeen) window.markAsSeen();
    
    if (window.PinSystem && !window.PinSystem.isUnlocked()) {
        window.PinSystem.showOverlayIfLocked();
    }
}

// Modal management functions
function showModerationModal(reason) {
    if (moderationReason) moderationReason.textContent = reason || 'Your message violates our community guidelines and cannot be sent.';
    if (moderationModal) {
        moderationModal.classList.remove('hidden');
        moderationModal.classList.add('flex');
    }
}

function hideModerationModal() {
    if (moderationModal) {
        moderationModal.classList.add('hidden');
        moderationModal.classList.remove('flex');
    }
}

function showBanModal(reason) {
    if (banReason) banReason.textContent = reason || 'The site administrator has not specified a reason for this ban.';
    if (banModal) {
        banModal.classList.remove('hidden');
        banModal.classList.add('flex');
    }
}

function hideBanModal() {
    if (banModal) {
        banModal.classList.add('hidden');
        banModal.classList.remove('flex');
    }
}

// Event listeners
function setupEventListeners() {
    // Tab switching
    if (loginTab) {
        loginTab.addEventListener('click', () => { 
            loginTab.classList.add('bg-blue-600','text-white'); 
            loginTab.classList.remove('text-gray-300'); 
            registerTab.classList.remove('bg-green-600','text-white'); 
            registerTab.classList.add('text-gray-300'); 
            loginForm.classList.remove('hidden'); 
            registerForm.classList.add('hidden'); 
        });
    }
    
    if (registerTab) {
        registerTab.addEventListener('click', () => { 
            registerTab.classList.add('bg-green-600','text-white'); 
            registerTab.classList.remove('text-gray-300'); 
            loginTab.classList.remove('bg-blue-600','text-white'); 
            loginTab.classList.add('text-gray-300'); 
            registerForm.classList.remove('hidden'); 
            loginForm.classList.add('hidden'); 
        });
    }

    // Form submissions
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (window.preventBannedActions && window.preventBannedActions()) return;
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;
            try { 
                const user = await window.login(username, password); 
                if (user) showChatScreen(user); 
            } catch (err) { 
                if (window.showError) window.showError(err.message); 
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (window.preventBannedActions && window.preventBannedActions()) return;
            const username = document.getElementById('register-username').value.trim();
            const password = document.getElementById('register-password').value;
            try { 
                const user = await window.register(username, password); 
                if (user) showChatScreen(user); 
            } catch (err) { 
                if (window.showError) window.showError(err.message); 
            }
        });
    }

    if (guestBtn) {
        guestBtn.addEventListener('click', async () => {
            if (window.preventBannedActions && window.preventBannedActions()) return;
            try { 
                const user = await window.guestLogin(); 
                if (user) showChatScreen(user); 
            } catch (err) { 
                if (window.showError) window.showError(err.message); 
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => { showAuthScreen(); });
    }

    // Message handling
    if (messageForm) {
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = messageInput.value.trim(); 
            if (!content) return;
            
            if (window.setLoading) window.setLoading(true);
            try { 
                const recipient_id = currentRecipient ? currentRecipient.id : null; 
                const message = await window.sendMessage(content, recipient_id); 
                messageInput.value = ''; 
                if (window.updateCharCount) window.updateCharCount(); 
                if (window.addMessage) window.addMessage(message); 
            } catch (err) { 
                console.error('Failed to send message:', err); 
                if (err.message && err.message.includes('Account banned')) {
                    try {
                        const errorData = JSON.parse(err.message);
                        if (errorData.ban_info) {
                            showBanModal(errorData.ban_info.reason);
                            return;
                        }
                    } catch {}
                    showBanModal('Your account has been banned.');
                } else if (err.message && err.message.includes('blocked by content filter')) {
                    try {
                        const errorData = JSON.parse(err.message);
                        showModerationModal(errorData.reason);
                    } catch {
                        showModerationModal('Your message was blocked by our content filter.');
                    }
                } else {
                    if (window.showError) window.showError('Failed to send message'); 
                }
            } finally { 
                if (window.setLoading) window.setLoading(false); 
                if (messageInput) messageInput.focus(); 
            }
        });
    }

    if (messageInput) {
        messageInput.addEventListener('input', () => {
            if (window.updateCharCount) window.updateCharCount();
        });
        
        messageInput.addEventListener('keydown', (e) => { 
            if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                if (messageForm) messageForm.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); 
            } 
        });
    }

    // User selection
    if (userSelect) {
        userSelect.addEventListener('change', () => {
            const val = userSelect.value;
            if (!val) { 
                currentRecipient = null; 
                if (clearRecipientBtn) clearRecipientBtn.classList.add('hidden'); 
            } else { 
                const u = window.usersList.find(x => String(x.id) === String(val)); 
                if (u) { 
                    currentRecipient = { id: u.id, username: u.username }; 
                    if (clearRecipientBtn) clearRecipientBtn.classList.remove('hidden'); 
                } else { 
                    currentRecipient = null; 
                    if (clearRecipientBtn) clearRecipientBtn.classList.add('hidden'); 
                } 
            }
            if (window.loadMessages) window.loadMessages();
        });
    }

    if (clearRecipientBtn) {
        clearRecipientBtn.addEventListener('click', () => { 
            currentRecipient = null; 
            if (userSelect) userSelect.value = ''; 
            clearRecipientBtn.classList.add('hidden'); 
            if (window.loadMessages) window.loadMessages(); 
        });
    }

    if (statusSelect) {
        statusSelect.addEventListener('change', () => {
            updateUserStatus(statusSelect.value);
        });
    }

    // Modal event listeners
    if (moderationOk) {
        moderationOk.addEventListener('click', hideModerationModal);
    }
    
    if (banOk) {
        banOk.addEventListener('click', () => {
            hideBanModal();
            // Reload page to clear any session data
            window.location.reload();
        });
    }

    // Global event listeners
    document.addEventListener('visibilitychange', () => {
        if (currentUser) {
            if (document.hidden) { 
                if (window.stopPolling) window.stopPolling();
                // Set to away when tab becomes hidden
                if (!currentUser.is_guest && window.currentUserStatus === 'online') {
                    if (window.updateUserStatus) window.updateUserStatus('away');
                }
            } else {
                if (window.markAsSeen) window.markAsSeen();
                // Reset to online when tab becomes visible again
                if (!currentUser.is_guest && window.currentUserStatus === 'away') {
                    if (window.updateUserStatus) window.updateUserStatus('online');
                }
                if (window.resetAwayTimer) window.resetAwayTimer();
                
                if (window.PinSystem && window.PinSystem.isUnlocked()) { 
                    if (window.loadMessages) window.loadMessages(); 
                    if (window.startPolling) window.startPolling(); 
                } else if (window.PinSystem && !window.PinSystem.isUnlocked()) { 
                    window.PinSystem.showOverlayIfLocked(); 
                }
            }
        }
    });

    window.addEventListener('focus', () => { 
        if (window.markAsSeen) window.markAsSeen(); 
        if (currentUser && !currentUser.is_guest) {
            if (window.resetAwayTimer) window.resetAwayTimer();
            if (window.currentUserStatus === 'away') {
                if (window.updateUserStatus) window.updateUserStatus('online');
            }
        }
        if (window.PinSystem && window.PinSystem.isUnlocked()) {
            if (window.loadMessages) window.loadMessages(); 
        } 
    });

    // Track user activity to reset away timer
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
        document.addEventListener(event, () => {
            if (currentUser && !currentUser.is_guest) {
                if (window.resetAwayTimer) window.resetAwayTimer();
            }
        }, { passive: true });
    });

    // Custom event listeners for modals
    document.addEventListener('showModerationModal', (e) => {
        showModerationModal(e.detail);
    });

    document.addEventListener('showBanModal', (e) => {
        showBanModal(e.detail);
    });
}

// Initialize the application
function init() {
    // Set global variables for other modules
    window.currentUser = currentUser;
    window.currentRecipient = currentRecipient;
    window.API_BASE_URL = window.API_BASE_URL || 'https://chat.nighthawk.work/api';
    window.AWAY_TIMEOUT = window.AWAY_TIMEOUT || 5 * 60 * 1000;
    window.HEARTBEAT_INTERVAL = window.HEARTBEAT_INTERVAL || 30 * 1000;
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup module-specific event listeners
    if (window.setupAdminEventListeners) window.setupAdminEventListeners();
    if (window.setupProfileEventListeners) window.setupProfileEventListeners();
    if (window.setupStatusEventListeners) window.setupStatusEventListeners();
    
    // Load configuration
    if (window.loadConfig) window.loadConfig();
    
    // Initialize character count
    if (window.updateCharCount) window.updateCharCount();
    
    // Set default favicon
    if (window.setFavicon) window.setFavicon(window.DEFAULT_FAVICON || 'https://onlinenotepad.org/favicon.ico');
    
    // Set page title
    document.title = 'Online Notepad';
    
    // Check for cookie ban on page load
    if (window.checkCookieBan && window.checkCookieBan()) {
        // Hide auth screen and show ban modal
        if (authScreen) authScreen.classList.add('hidden');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        currentUser,
        currentRecipient,
        showAuthScreen,
        showChatScreen,
        showModerationModal,
        hideModerationModal,
        showBanModal,
        hideBanModal,
        setupEventListeners,
        init
    };
}
