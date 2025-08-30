// GIF Browser module

(function gifBrowserModule() {
    const gifBtn = document.getElementById('gif-btn');
    const gifBrowser = document.getElementById('gif-browser');
    const gifSearch = document.getElementById('gif-search');
    const gifGrid = document.getElementById('gif-grid');
    
    let searchTimeout = null;
    let isGifBrowserOpen = false;
    
    async function searchGifs(query) {
        if (!query.trim()) {
            gifGrid.innerHTML = `
                <div class="text-center text-gray-400 py-8 col-span-full">
                    <i class="fas fa-search text-2xl mb-2"></i>
                    <p>Search for GIFs to send</p>
                </div>
            `;
            return;
        }
        
        gifGrid.innerHTML = `
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
                gifGrid.innerHTML = '';
                data.gifs.forEach(gif => {
                    const gifItem = document.createElement('div');
                    gifItem.className = 'gif-item';
                    gifItem.innerHTML = `<img src="${gif.preview_url || gif.url}" alt="${gif.title}" loading="lazy">`;
                    gifItem.addEventListener('click', () => sendGif(gif.url));
                    gifGrid.appendChild(gifItem);
                });
            } else {
                gifGrid.innerHTML = `
                    <div class="text-center text-gray-400 py-8 col-span-full">
                        <i class="fas fa-search text-2xl mb-2"></i>
                        <p>No GIFs found. Try a different search term.</p>
                    </div>
                `;
            }
        } catch (err) {
            console.error('GIF search failed:', err);
            gifGrid.innerHTML = `
                <div class="text-center text-red-400 py-8 col-span-full">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Failed to search GIFs. Please try again.</p>
                </div>
            `;
        }
    }
    
    function toggleGifBrowser() {
        isGifBrowserOpen = !isGifBrowserOpen;
        if (isGifBrowserOpen) {
            gifBrowser.classList.remove('hidden');
            gifBtn.classList.add('active');
            gifSearch.focus();
        } else {
            gifBrowser.classList.add('hidden');
            gifBtn.classList.remove('active');
            gifSearch.value = '';
            gifGrid.innerHTML = `
                <div class="text-center text-gray-400 py-8 col-span-full">
                    <i class="fas fa-search text-2xl mb-2"></i>
                    <p>Search for GIFs to send</p>
                </div>
            `;
        }
    }
    
    async function sendGif(gifUrl) {
        if (!window.currentUser) return;
        
        window.setLoading(true);
        try {
            const recipient_id = window.currentRecipient ? window.currentRecipient.id : null;
            const message = await window.sendMessage(gifUrl, recipient_id);
            window.addMessage(message);
            toggleGifBrowser(); // Close the browser after sending
        } catch (err) {
            console.error('Failed to send GIF:', err);
            if (err.message && err.message.includes('blocked by content filter')) {
                try {
                    const errorData = JSON.parse(err.message);
                    // Trigger moderation modal event
                    const event = new CustomEvent('showModerationModal', { detail: errorData.reason });
                    document.dispatchEvent(event);
                } catch {
                    // Trigger moderation modal event
                    const event = new CustomEvent('showModerationModal', { detail: 'Your GIF was blocked by our content filter.' });
                    document.dispatchEvent(event);
                }
            } else {
                window.showError('Failed to send GIF');
            }
        } finally {
            window.setLoading(false);
        }
    }
    
    // Event listeners
    if (gifBtn) {
        gifBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleGifBrowser();
        });
    }
    
    if (gifSearch) {
        gifSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchGifs(e.target.value);
            }, 500);
        });
    }
    
    // Close GIF browser when clicking outside
    document.addEventListener('click', (e) => {
        if (isGifBrowserOpen && !gifBrowser.contains(e.target) && !gifBtn.contains(e.target)) {
            toggleGifBrowser();
        }
    });
    
    // Prevent form submission when in GIF browser
    if (gifBrowser) {
        gifBrowser.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    if (gifSearch) {
        gifSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                toggleGifBrowser();
            }
            e.stopPropagation();
        });
    }
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {};
}
