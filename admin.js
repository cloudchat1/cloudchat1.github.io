// Admin module - handles admin controls and user banning

async function banUser(username, reason) {
    if (!window.currentUser || window.currentUser.username.toLowerCase() !== 'owner') {
        throw new Error('Unauthorized');
    }
    
    try {
        const response = await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}/admin/ban`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_username: window.currentUser.username,
                target_username: username,
                reason: reason
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ban failed');
        return data;
    } catch (err) {
        console.error('Ban user failed:', err);
        throw err;
    }
}

async function unbanUser(username) {
    if (!window.currentUser || window.currentUser.username.toLowerCase() !== 'owner') {
        throw new Error('Unauthorized');
    }
    
    try {
        const response = await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}/admin/unban`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_username: window.currentUser.username,
                target_username: username
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unban failed');
        return data;
    } catch (err) {
        console.error('Unban user failed:', err);
        throw err;
    }
}

function showAdminModal() {
    const adminModal = document.getElementById('admin-modal');
    const banUsernameInput = document.getElementById('ban-username');
    const banReasonInput = document.getElementById('ban-reason-input');
    const unbanUsernameInput = document.getElementById('unban-username');
    const adminMsg = document.getElementById('admin-msg');
    
    if (!adminModal || !banUsernameInput || !banReasonInput || !unbanUsernameInput || !adminMsg) return;
    
    adminModal.classList.remove('hidden');
    adminModal.classList.add('flex');
    banUsernameInput.value = '';
    banReasonInput.value = '';
    unbanUsernameInput.value = '';
    adminMsg.textContent = '';
}

function hideAdminModal() {
    const adminModal = document.getElementById('admin-modal');
    if (!adminModal) return;
    
    adminModal.classList.add('hidden');
    adminModal.classList.remove('flex');
}

function setupAdminEventListeners() {
    const adminBtn = document.getElementById('admin-btn');
    const adminModalClose = document.getElementById('admin-modal-close');
    const banUserBtn = document.getElementById('ban-user-btn');
    const unbanUserBtn = document.getElementById('unban-user-btn');
    const banUsernameInput = document.getElementById('ban-username');
    const banReasonInput = document.getElementById('ban-reason-input');
    const unbanUsernameInput = document.getElementById('unban-username');
    const adminMsg = document.getElementById('admin-msg');

    if (adminBtn) {
        adminBtn.addEventListener('click', showAdminModal);
    }
    
    if (adminModalClose) {
        adminModalClose.addEventListener('click', hideAdminModal);
    }

    if (banUserBtn && banUsernameInput && banReasonInput && adminMsg) {
        banUserBtn.addEventListener('click', async () => {
            const username = banUsernameInput.value.trim();
            const reason = banReasonInput.value.trim();
            
            if (!username) {
                adminMsg.textContent = 'Please enter a username';
                adminMsg.className = 'text-sm text-center text-red-400';
                return;
            }
            
            try {
                await banUser(username, reason);
                adminMsg.textContent = `User ${username} has been banned`;
                adminMsg.className = 'text-sm text-center text-green-400';
                banUsernameInput.value = '';
                banReasonInput.value = '';
            } catch (err) {
                adminMsg.textContent = err.message || 'Failed to ban user';
                adminMsg.className = 'text-sm text-center text-red-400';
            }
        });
    }

    if (unbanUserBtn && unbanUsernameInput && adminMsg) {
        unbanUserBtn.addEventListener('click', async () => {
            const username = unbanUsernameInput.value.trim();
            
            if (!username) {
                adminMsg.textContent = 'Please enter a username';
                adminMsg.className = 'text-sm text-center text-red-400';
                return;
            }
            
            try {
                await unbanUser(username);
                adminMsg.textContent = `User ${username} has been unbanned`;
                adminMsg.className = 'text-sm text-center text-green-400';
                unbanUsernameInput.value = '';
            } catch (err) {
                adminMsg.textContent = err.message || 'Failed to unban user';
                adminMsg.className = 'text-sm text-center text-red-400';
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        banUser,
        unbanUser,
        showAdminModal,
        hideAdminModal,
        setupAdminEventListeners
    };
}
