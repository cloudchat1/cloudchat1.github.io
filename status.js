// Status module - handles user status management

let currentUserStatus = 'online';
let lastActivity = Date.now();
let heartbeatInterval = null;
let awayTimeout = null;

function updateUserStatus(newStatus, broadcast = true) {
    if (window.currentUser && window.currentUser.is_guest) return; // Guests don't have status
    
    const oldStatus = currentUserStatus;
    currentUserStatus = newStatus;
    
    const statusSelect = document.getElementById('status-select');
    if (statusSelect) statusSelect.value = newStatus;
    
    // Store status in localStorage
    if (window.currentUser && !window.currentUser.is_guest) {
        localStorage.setItem(`user_status_${window.currentUser.username}`, currentUserStatus);
    }
    
    // Broadcast status change if needed
    if (broadcast && oldStatus !== newStatus) {
        sendHeartbeat();
    }
}

function resetAwayTimer() {
    lastActivity = Date.now();
    
    // If currently away due to inactivity, switch back to online
    if (currentUserStatus === 'away' && window.currentUser && !window.currentUser.is_guest) {
        updateUserStatus('online');
    }
    
    // Clear existing away timeout
    if (awayTimeout) {
        clearTimeout(awayTimeout);
    }
    
    // Set new away timeout
    const AWAY_TIMEOUT = window.AWAY_TIMEOUT || 5 * 60 * 1000;
    awayTimeout = setTimeout(() => {
        if (currentUserStatus === 'online' && !document.hidden) {
            updateUserStatus('away');
        }
    }, AWAY_TIMEOUT);
}

async function sendHeartbeat() {
    if (!window.currentUser || window.currentUser.is_guest) return;
    
    try {
        await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}/heartbeat`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: window.currentUser.id,
                username: window.currentUser.username,
                status: currentUserStatus,
                timestamp: Date.now()
            })
        });
    } catch (err) {
        console.warn('Heartbeat failed:', err);
    }
}

function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (!window.currentUser || window.currentUser.is_guest) return;
    
    // Send initial heartbeat
    sendHeartbeat();
    
    // Set up regular heartbeat
    const HEARTBEAT_INTERVAL = window.HEARTBEAT_INTERVAL || 30 * 1000;
    heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    if (awayTimeout) {
        clearTimeout(awayTimeout);
        awayTimeout = null;
    }
}

function setupStatusEventListeners() {
    const statusSelect = document.getElementById('status-select');
    
    if (statusSelect) {
        statusSelect.addEventListener('change', () => {
            updateUserStatus(statusSelect.value);
        });
    }
    
    // Track user activity to reset away timer
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
        document.addEventListener(event, () => {
            if (window.currentUser && !window.currentUser.is_guest) {
                resetAwayTimer();
            }
        }, { passive: true });
    });
    
    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (window.currentUser) {
            if (document.hidden) { 
                // Set to away when tab becomes hidden
                if (!window.currentUser.is_guest && currentUserStatus === 'online') {
                    updateUserStatus('away');
                }
            } else {
                // Reset to online when tab becomes visible again
                if (!window.currentUser.is_guest && currentUserStatus === 'away') {
                    updateUserStatus('online');
                }
                resetAwayTimer();
            }
        }
    });
    
    // Handle window focus
    window.addEventListener('focus', () => { 
        if (window.currentUser && !window.currentUser.is_guest) {
            resetAwayTimer();
            if (currentUserStatus === 'away') {
                updateUserStatus('online');
            }
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        currentUserStatus,
        lastActivity,
        heartbeatInterval,
        awayTimeout,
        updateUserStatus,
        resetAwayTimer,
        sendHeartbeat,
        startHeartbeat,
        stopHeartbeat,
        setupStatusEventListeners
    };
}
