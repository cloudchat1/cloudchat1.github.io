// Configuration and constants
const API_BASE_URL = 'https://chat.nighthawk.work/api';
const DEFAULT_FAVICON = 'https://onlinenotepad.org/favicon.ico';
const NOTIF_FAVICON = 'https://cdn-icons-png.flaticon.com/512/1827/1827504.png';

// Status constants
const AWAY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

// Notes app constants
const NOTES_KEY = 'notes_app_v1';

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_BASE_URL,
        DEFAULT_FAVICON,
        NOTIF_FAVICON,
        AWAY_TIMEOUT,
        HEARTBEAT_INTERVAL,
        NOTES_KEY
    };
}
