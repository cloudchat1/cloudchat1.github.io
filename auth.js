// Authentication module

let config = { guest_login_enabled: true };

async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}${endpoint}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Request failed');
        return data;
    } catch (err) {
        console.warn('API request failed (stubbed):', err);

        if (endpoint.startsWith('/config')) return { guest_login_enabled: true };
        if (endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register') || endpoint.startsWith('/auth/guest')) {
            return { user: { id: Date.now(), username: 'guest-' + Math.floor(Math.random()*9999), is_guest: true } };
        }
        if (endpoint.startsWith('/messages')) return { messages: [] };
        if (endpoint.startsWith('/users')) return { users: [] };
        return {};
    }
}

async function loadConfig() {
    try {
        const data = await apiRequest('/config');
        config = data;
        const guestSection = document.getElementById('guest-section');
        if (guestSection && !config.guest_login_enabled) {
            guestSection.classList.add('hidden');
        }
    } catch (err) {
        console.error('Failed to load config:', err);
    }
}

async function login(username, password) {
    try {
        const response = await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (!response.ok) {
            if (data.banned && data.ban_info) {
                // Trigger ban modal event
                const event = new CustomEvent('showBanModal', { detail: data.ban_info.reason });
                document.dispatchEvent(event);
                // Set cookie ban from JavaScript
                document.cookie = `banned_user=${data.ban_info.user_id}; max-age=${365*24*60*60}; path=/`;
                return null;
            }
            throw new Error(data.error || 'Login failed');
        }
        
        return data.user;
    } catch (err) {
        if (err.name !== 'TypeError') { // Don't handle network errors here
            throw err;
        }
        // Fallback to original method for network issues
        const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
        return data.user;
    }
}

async function register(username, password) {
    try {
        const response = await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}/auth/register`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (!response.ok) {
            if (data.banned && data.ban_info) {
                // Trigger ban modal event
                const event = new CustomEvent('showBanModal', { detail: data.ban_info.reason });
                document.dispatchEvent(event);
                return null;
            }
            throw new Error(data.error || 'Registration failed');
        }
        
        return data.user;
    } catch (err) {
        if (err.name !== 'TypeError') { // Don't handle network errors here
            throw err;
        }
        // Fallback to original method for network issues
        const data = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) });
        return data.user;
    }
}

async function guestLogin() {
    try {
        const response = await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}/auth/guest`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        
        if (!response.ok) {
            if (data.banned && data.ban_info) {
                // Trigger ban modal event
                const event = new CustomEvent('showBanModal', { detail: data.ban_info.reason });
                document.dispatchEvent(event);
                return null;
            }
            throw new Error(data.error || 'Guest login failed');
        }
        
        return data.user;
    } catch (err) {
        if (err.name !== 'TypeError') { // Don't handle network errors here
            throw err;
        }
        // Fallback to original method for network issues
        const data = await apiRequest('/auth/guest', { method: 'POST' });
        return data.user;
    }
}

function checkCookieBan() {
    // Check if user has a banned cookie
    const bannedCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('banned_user='));
    
    if (bannedCookie) {
        // Trigger ban modal event
        const event = new CustomEvent('showBanModal', { detail: 'You have been banned from this site.' });
        document.dispatchEvent(event);
        return true;
    }
    return false;
}

function preventBannedActions() {
    // Check for cookie ban before any auth action
    if (checkCookieBan()) {
        return true; // Prevent action
    }
    return false; // Allow action
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        config,
        loadConfig,
        login,
        register,
        guestLogin,
        checkCookieBan,
        preventBannedActions
    };
}
