// Profile module - handles profile picture functionality

function showProfilePicModal() {
    const profilePicModal = document.getElementById('profile-pic-modal');
    const profilePicSearch = document.getElementById('profile-pic-search');
    const profilePicGrid = document.getElementById('profile-pic-grid');
    const profilePicMsg = document.getElementById('profile-pic-msg');
    
    if (!profilePicModal || !profilePicSearch || !profilePicGrid || !profilePicMsg) return;
    
    profilePicModal.classList.remove('hidden');
    profilePicModal.classList.add('flex');
    profilePicSearch.value = '';
    profilePicMsg.textContent = '';
    profilePicGrid.innerHTML = `
        <div class="text-center text-gray-400 py-8 col-span-full">
            <i class="fas fa-search text-2xl mb-2"></i>
            <p>Search for GIFs to use as your profile picture</p>
        </div>
    `;
    profilePicSearch.focus();
}

function hideProfilePicModal() {
    const profilePicModal = document.getElementById('profile-pic-modal');
    if (!profilePicModal) return;
    
    profilePicModal.classList.add('hidden');
    profilePicModal.classList.remove('flex');
}

async function searchProfilePicGifs(query) {
    const profilePicGrid = document.getElementById('profile-pic-grid');
    if (!profilePicGrid) return;
    
    if (!query.trim()) {
        profilePicGrid.innerHTML = `
            <div class="text-center text-gray-400 py-8 col-span-full">
                <i class="fas fa-search text-2xl mb-2"></i>
                <p>Search for GIFs to use as your profile picture</p>
            </div>
        `;
        return;
    }
    
    profilePicGrid.innerHTML = `
        <div class="text-center text-gray-400 py-8 col-span-full">
            <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
            <p>Searching...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}/gifs/search?q=${encodeURIComponent(query)}&limit=20`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to search GIFs');
        }
        
        if (data.gifs && data.gifs.length > 0) {
            profilePicGrid.innerHTML = '';
            data.gifs.forEach(gif => {
                const gifItem = document.createElement('div');
                gifItem.className = 'aspect-square rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 bg-dark-700';
                gifItem.innerHTML = `<img src="${gif.preview_url || gif.url}" alt="${gif.title}" loading="lazy" class="w-full h-full object-cover">`;
                gifItem.addEventListener('click', () => setProfilePicture(gif.url));
                profilePicGrid.appendChild(gifItem);
            });
        } else {
            profilePicGrid.innerHTML = `
                <div class="text-center text-gray-400 py-8 col-span-full">
                    <i class="fas fa-search text-2xl mb-2"></i>
                    <p>No GIFs found. Try a different search term.</p>
                </div>
            `;
        }
    } catch (err) {
        console.error('Profile pic GIF search failed:', err);
        profilePicGrid.innerHTML = `
            <div class="text-center text-red-400 py-8 col-span-full">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Failed to search GIFs. Please try again.</p>
            </div>
        `;
    }
}

async function setProfilePicture(gifUrl) {
    if (!window.currentUser || window.currentUser.is_guest) return;
    
    const profilePicMsg = document.getElementById('profile-pic-msg');
    if (!profilePicMsg) return;
    
    try {
        const response = await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}/user/profile-picture`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: window.currentUser.id,
                profile_picture_url: gifUrl
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to set profile picture');
        }
        
        profilePicMsg.textContent = 'Profile picture updated!';
        profilePicMsg.className = 'text-sm text-center text-green-400';
        
        // Update user in usersList to reflect the change
        const userIndex = window.usersList.findIndex(u => u.id === window.currentUser.id);
        if (userIndex !== -1) {
            window.usersList[userIndex].profile_picture = gifUrl;
        }
        
        // Refresh messages to show new profile picture
        window.loadMessages();
        
        setTimeout(() => {
            hideProfilePicModal();
        }, 1500);
    } catch (err) {
        console.error('Failed to set profile picture:', err);
        profilePicMsg.textContent = err.message || 'Failed to set profile picture';
        profilePicMsg.className = 'text-sm text-center text-red-400';
    }
}

async function removeProfilePicture() {
    if (!window.currentUser || window.currentUser.is_guest) return;
    
    const profilePicMsg = document.getElementById('profile-pic-msg');
    if (!profilePicMsg) return;
    
    try {
        const response = await fetch(`${window.API_BASE_URL || 'https://chat.nighthawk.work/api'}/user/profile-picture`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: window.currentUser.id,
                profile_picture_url: null
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to remove profile picture');
        }
        
        profilePicMsg.textContent = 'Profile picture removed!';
        profilePicMsg.className = 'text-sm text-center text-green-400';
        
        // Update user in usersList to reflect the change
        const userIndex = window.usersList.findIndex(u => u.id === window.currentUser.id);
        if (userIndex !== -1) {
            window.usersList[userIndex].profile_picture = null;
        }
        
        // Refresh messages to show default avatar
        window.loadMessages();
        
        setTimeout(() => {
            hideProfilePicModal();
        }, 1500);
    } catch (err) {
        console.error('Failed to remove profile picture:', err);
        profilePicMsg.textContent = err.message || 'Failed to remove profile picture';
        profilePicMsg.className = 'text-sm text-center text-red-400';
    }
}

function setupProfileEventListeners() {
    const profilePicBtn = document.getElementById('profile-pic-btn');
    const profilePicModalClose = document.getElementById('profile-pic-modal-close');
    const removeProfilePicBtn = document.getElementById('remove-profile-pic-btn');
    const profilePicSearch = document.getElementById('profile-pic-search');

    if (profilePicBtn) {
        profilePicBtn.addEventListener('click', showProfilePicModal);
    }
    
    if (profilePicModalClose) {
        profilePicModalClose.addEventListener('click', hideProfilePicModal);
    }
    
    if (removeProfilePicBtn) {
        removeProfilePicBtn.addEventListener('click', removeProfilePicture);
    }

    if (profilePicSearch) {
        let searchTimeout = null;
        profilePicSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchProfilePicGifs(e.target.value);
            }, 500);
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showProfilePicModal,
        hideProfilePicModal,
        searchProfilePicGifs,
        setProfilePicture,
        removeProfilePicture,
        setupProfileEventListeners
    };
}
