// UI utilities and DOM manipulation functions

function showError(message) {
    const authError = document.getElementById('auth-error');
    if (authError) {
        authError.textContent = message;
        authError.classList.remove('hidden');
        setTimeout(() => authError.classList.add('hidden'), 5000);
    }
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function formatTime(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function updateCharCount() {
    const messageInput = document.getElementById('message-input');
    const charCount = document.getElementById('char-count');
    if (!messageInput || !charCount) return;
    
    const len = messageInput.value.length;
    charCount.textContent = `${len}/500`;
    if (len > 450) charCount.className = 'text-xs text-red-400';
    else if (len > 400) charCount.className = 'text-xs text-yellow-400';
    else charCount.className = 'text-xs text-gray-400';
}

function setLoading(loading) {
    const sendButton = document.getElementById('send-button');
    const messageInput = document.getElementById('message-input');
    const sendText = document.getElementById('send-text');
    const sendLoading = document.getElementById('send-loading');
    
    if (!sendButton || !messageInput || !sendText || !sendLoading) return;
    
    sendButton.disabled = loading;
    messageInput.disabled = loading;
    if (loading) {
        sendText.classList.add('hidden');
        sendLoading.classList.remove('hidden');
    } else {
        sendText.classList.remove('hidden');
        sendLoading.classList.add('hidden');
    }
}

function scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
}

function setFavicon(url) {
    const faviconEl = document.getElementById('favicon');
    if (faviconEl) {
        faviconEl.href = url;
    } else {
        const link = document.createElement('link');
        link.id = 'favicon';
        link.rel = 'icon';
        link.href = url;
        document.head.appendChild(link);
    }
}

function markAsSeen() {
    const unseenCount = window.unseenCount || 0;
    window.unseenCount = 0;
    setFavicon(window.DEFAULT_FAVICON || 'https://onlinenotepad.org/favicon.ico');
    document.title = 'Online Notepad';
}

function incrementUnread() {
    window.unseenCount = (window.unseenCount || 0) + 1;
    setFavicon(window.NOTIF_FAVICON || 'https://cdn-icons-png.flaticon.com/512/1827/1827504.png');
    document.title = `(${window.unseenCount}) Online Notepad`;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showError,
        escapeHtml,
        formatTime,
        updateCharCount,
        setLoading,
        scrollToBottom,
        setFavicon,
        markAsSeen,
        incrementUnread
    };
}
