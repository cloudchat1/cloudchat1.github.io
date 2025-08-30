(function () {
    'use strict';

    // Keys used in local/session storage
    const PIN_HASH_KEY = 'chat_pin_hash_v2';
    const PIN_LENGTH_KEY = 'chat_pin_length_v2';
    const DUMMY_PIN_HASH_KEY = 'chat_dummy_pin_hash_v2';
    const DUMMY_PIN_LENGTH_KEY = 'chat_dummy_pin_length_v2';
    const SESSION_UNLOCK_KEY = 'chat_pin_unlocked_v2';

    // How long of inactivity before auto-lock (ms)
    const INACTIVITY_MS = 5 * 60 * 1000;

    // DOM elements (expected to exist in the page)
    const pinBtn = document.getElementById('pin-btn');
    const lockNowBtn = document.getElementById('lock-now-btn');
    const pinModal = document.getElementById('pin-modal');
    const pinModalClose = document.getElementById('pin-modal-close');
    const pinSetupInput = document.getElementById('pin-setup-input');
    const pinSetupConfirm = document.getElementById('pin-setup-confirm');
    const pinDummyInput = document.getElementById('pin-dummy-input');
    const pinDummyConfirm = document.getElementById('pin-dummy-confirm');
    const savePinBtn = document.getElementById('save-pin-btn');
    const removePinBtn = document.getElementById('remove-pin-btn');
    const pinSetupMsg = document.getElementById('pin-setup-msg');

    const lockOverlay = document.getElementById('lock-overlay');
    const pinBoxesContainer = document.getElementById('pin-boxes');
    const pinHidden = document.getElementById('pin-hidden');
    const unlockBtn = document.getElementById('unlock-btn');
    const unlockCancelBtn = document.getElementById('unlock-cancel-btn');
    const unlockMsg = document.getElementById('unlock-msg');

    let inactivityTimer = null;
    let inputElems = [];
    let currentLength = 4;
    let activityBound = false;

    function bufferToHex(buffer) {
        const bytes = new Uint8Array(buffer);
        return Array.prototype.map.call(bytes, x => ('00' + x.toString(16)).slice(-2)).join('');
    }

    async function hashPin(pin) {
        const enc = new TextEncoder();
        const data = enc.encode(pin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return bufferToHex(hashBuffer);
    }

    function pinExists() { return !!localStorage.getItem(PIN_HASH_KEY); }
    function getStoredPinLength() { return parseInt(localStorage.getItem(PIN_LENGTH_KEY) || '4', 10); }

    async function savePin(pin) {
        const h = await hashPin(pin);
        localStorage.setItem(PIN_HASH_KEY, h);
        localStorage.setItem(PIN_LENGTH_KEY, String(pin.length));
    }

    function dummyExists() { return !!localStorage.getItem(DUMMY_PIN_HASH_KEY); }
    function getStoredDummyLength() { return parseInt(localStorage.getItem(DUMMY_PIN_LENGTH_KEY) || '0', 10); }

    async function saveDummyPin(dummy) {
        const h = await hashPin(dummy);
        localStorage.setItem(DUMMY_PIN_HASH_KEY, h);
        localStorage.setItem(DUMMY_PIN_LENGTH_KEY, String(dummy.length));
    }

    function removeDummyPin() {
        localStorage.removeItem(DUMMY_PIN_HASH_KEY);
        localStorage.removeItem(DUMMY_PIN_LENGTH_KEY);
    }

    function removePin() {
        localStorage.removeItem(PIN_HASH_KEY);
        localStorage.removeItem(PIN_LENGTH_KEY);
        removeDummyPin();
    }

    async function verifyPin(pin) {
        const stored = localStorage.getItem(PIN_HASH_KEY);
        if (!stored) return false;
        const h = await hashPin(pin);
        return stored === h;
    }

    async function verifyDummyPin(pin) {
        const stored = localStorage.getItem(DUMMY_PIN_HASH_KEY);
        if (!stored) return false;
        const h = await hashPin(pin);
        return stored === h;
    }

    function sessionUnlock() { sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true'); }
    function sessionLock() { sessionStorage.removeItem(SESSION_UNLOCK_KEY); }
    function isSessionUnlocked() { return sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true'; }
    function isUnlocked() { if (!pinExists()) return true; return isSessionUnlocked(); }

    function buildPinBoxes(len) {
        pinBoxesContainer.innerHTML = '';
        inputElems = [];
        currentLength = len || getStoredPinLength() || 4;

        for (let i = 0; i < currentLength; i++) {
            const box = document.createElement('div');
            box.className = 'pin-box flex items-center justify-center text-2xl font-semibold rounded-lg shadow-inner bg-dark-700 border border-dark-500 w-16 h-16 md:w-20 md:h-20 select-none';
            box.setAttribute('data-index', String(i));
            box.setAttribute('tabindex', '0');
            box.textContent = '';
            pinBoxesContainer.appendChild(box);
            inputElems.push(box);
        }

        pinHidden.value = '';

        pinHidden.setAttribute('maxlength', Math.max(currentLength, getStoredDummyLength() || 0));
        pinHidden.focus();

        pinHidden.oninput = (e) => {
            const val = pinHidden.value.replace(/\D/g, '');
            const clampLen = Math.max(currentLength, getStoredDummyLength() || 0);
            pinHidden.value = val.slice(0, clampLen);
            const displayVal = pinHidden.value.slice(0, currentLength);
            for (let i = 0; i < currentLength; i++) {
                inputElems[i].textContent = displayVal[i] || '';
                inputElems[i].classList.toggle('filled', !!displayVal[i]);
            }

            (async () => {
                const typed = pinHidden.value.replace(/\D/g, '');

                // If dummy exists and typed length matches dummy length -> try dummy
                if (dummyExists() && typed.length === getStoredDummyLength()) {
                    const okDummy = await verifyDummyPin(typed);
                    if (okDummy) {
                        // Trigger the helper that opens notes (if present)
                        if (typeof window.openNotesMode === 'function') {
                            window.openNotesMode();
                        } else {
                            document.dispatchEvent(new CustomEvent('dummyPinMatched', { detail: { pin: typed } }));
                        }

                        pinHidden.value = '';
                        inputElems.forEach(b => b.textContent = '');
                        return;
                    }
                }

                // If typed length reaches the main PIN length -> attempt unlock
                if (typed.length >= currentLength) {
                    attemptUnlock(typed.slice(0, currentLength));
                }
            })();
        };

        pinHidden.onpaste = (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, Math.max(currentLength, getStoredDummyLength() || 0));
            pinHidden.value = text;
            pinHidden.dispatchEvent(new Event('input'));
        };

        inputElems.forEach((box) => {
            box.addEventListener('click', () => {
                pinHidden.focus();
                pinHidden.selectionStart = pinHidden.selectionEnd = pinHidden.value.length;
            });
        });
    }

    async function attemptUnlock(candidate) {
        unlockMsg.textContent = '';

        // Try dummy first if present
        if (dummyExists()) {
            const isDummy = await verifyDummyPin(candidate);
            if (isDummy) {
                if (typeof window.openNotesMode === 'function') {
                    window.openNotesMode();
                } else {
                    document.dispatchEvent(new CustomEvent('dummyPinMatched', { detail: { pin: candidate } }));
                }
                pinHidden.value = '';
                inputElems.forEach(b => b.textContent = '');
                return;
            }
        }

        if (!pinExists()) { unlockMsg.textContent = 'No PIN set.'; return; }
        const ok = await verifyPin(candidate);
        if (ok) {
            sessionUnlock();
            hideOverlay();
            // Resume app behavior if those functions exist on window
            if (typeof window.loadMessages === 'function') window.loadMessages();
            if (typeof window.startPolling === 'function') window.startPolling();
            resetInactivityTimer();
        } else {
            unlockMsg.textContent = 'Incorrect PIN';
            pinBoxesContainer.classList.add('shake');
            setTimeout(() => pinBoxesContainer.classList.remove('shake'), 420);
            pinHidden.value = '';
            inputElems.forEach(b => b.textContent = '');
            setTimeout(() => pinHidden.focus(), 150);
        }
    }

    function showOverlay() {
        buildPinBoxes(getStoredPinLength() || 4);
        lockOverlay.classList.remove('hidden');
        if (typeof window.stopPolling === 'function') window.stopPolling();
        pinHidden.focus();
    }

    function hideOverlay() {
        lockOverlay.classList.add('hidden');
        pinHidden.value = '';
        inputElems.forEach(b => b.textContent = '');
    }

    async function lockNow() {
        if (!pinExists()) {
            if (!confirm('No PIN set. Would you like to set one now?')) return;
            openModal();
            return;
        }
        sessionLock();
        showOverlay();
    }

    function startActivityTracking() {
        if (activityBound) return;
        const reset = () => resetInactivityTimer();
        ['mousemove','keydown','click','touchstart'].forEach(evt => window.addEventListener(evt, reset, { passive: true }));
        activityBound = true;
        resetInactivityTimer();
    }

    function resetInactivityTimer() { clearInactivityTimer(); inactivityTimer = setTimeout(() => { sessionLock(); showOverlay(); }, INACTIVITY_MS); }
    function clearInactivityTimer() { if (inactivityTimer) { clearTimeout(inactivityTimer); inactivityTimer = null; } }

    function openModal() {
        if (!pinModal) return;
        pinSetupInput.value = '';
        pinSetupConfirm.value = '';
        pinDummyInput.value = '';
        pinDummyConfirm.value = '';
        pinSetupMsg.textContent = '';
        pinModal.classList.remove('hidden');
        setTimeout(() => pinSetupInput.focus(), 80);
    }

    function closeModal() { if (!pinModal) return; pinModal.classList.add('hidden'); }

    if (pinBtn) pinBtn.addEventListener('click', openModal);
    if (pinModalClose) pinModalClose.addEventListener('click', closeModal);

    if (savePinBtn) savePinBtn.addEventListener('click', async () => {
        pinSetupMsg.textContent = '';
        const a = (pinSetupInput && pinSetupInput.value || '').trim();
        const b = (pinSetupConfirm && pinSetupConfirm.value || '').trim();
        const da = (pinDummyInput && pinDummyInput.value || '').trim();
        const db = (pinDummyConfirm && pinDummyConfirm.value || '').trim();

        if (!/^\d{4,8}$/.test(a)) { pinSetupMsg.textContent = 'PIN must be 4–8 digits.'; return; }
        if (a !== b) { pinSetupMsg.textContent = 'PINs do not match.'; return; }

        if (da || db) {
            if (!/^\d{4,8}$/.test(da)) { pinSetupMsg.textContent = 'Dummy PIN must be 4–8 digits.'; return; }
            if (da !== db) { pinSetupMsg.textContent = 'Dummy PINs do not match.'; return; }
            if (da === a) { pinSetupMsg.textContent = 'Dummy PIN should be different from the main PIN.'; return; }
        }

        try {
            await savePin(a);
            if (da) {
                await saveDummyPin(da);
                pinSetupMsg.textContent = 'PIN and dummy PIN saved.';
            } else {
                removeDummyPin();
                pinSetupMsg.textContent = 'PIN saved. Dummy PIN removed (if any).';
            }

            sessionUnlock();
            closeModal();
        } catch (err) {
            console.error('Error saving PINs:', err);
            pinSetupMsg.textContent = 'Failed to save PIN.';
        }
    });

    if (removePinBtn) removePinBtn.addEventListener('click', () => {
        if (!pinExists() && !dummyExists()) { if (pinSetupMsg) pinSetupMsg.textContent = 'No PIN set.'; return; }
        if (!confirm('Remove the PIN (and any dummy PIN)? This will disable locking.')) return;
        removePin();
        sessionLock();
        if (pinSetupMsg) pinSetupMsg.textContent = 'PIN removed.';
        closeModal();
    });

    if (lockNowBtn) lockNowBtn.addEventListener('click', lockNow);

    if (unlockBtn) unlockBtn.addEventListener('click', () => {
        const val = (document.getElementById('pin-hidden') || {}).value || '';
        const normalized = val.replace(/\D/g, '');
        if (!normalized || normalized.length < (getStoredPinLength() || 4)) {
            if (dummyExists() && normalized.length >= getStoredDummyLength()) {
                unlockMsg.textContent = 'Checking...';
                return;
            }
            unlockMsg.textContent = 'Enter full PIN';
            pinHidden.focus();
            return;
        }
        attemptUnlock(normalized.slice(0, getStoredPinLength() || 4));
    });

    if (unlockCancelBtn) {
        unlockCancelBtn.addEventListener('click', () => {
            pinHidden.value = '';
            inputElems.forEach(b => b.textContent = '');
            if (unlockMsg) unlockMsg.textContent = '';
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (pinExists()) {
                sessionLock();
            }
        } else {
            if (!isUnlocked()) {
                showOverlay();
            } else {
                if (typeof window.loadMessages === 'function') window.loadMessages();
                if (typeof window.startPolling === 'function') window.startPolling();
                resetInactivityTimer();
            }
        }
    });

    document.addEventListener('paste', (e) => {
        if (!lockOverlay || lockOverlay.classList.contains('hidden')) return;
        const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
        if (!text) return;
        pinHidden.value = text.slice(0, Math.max(getStoredPinLength() || 4, getStoredDummyLength() || 0));
        pinHidden.dispatchEvent(new Event('input'));
    });

    if (pinExists() && !isSessionUnlocked()) {
        showOverlay();
    }

    // Expose PinSystem to global scope for the rest of the app to use
    window.PinSystem = {
        isUnlocked,
        showOverlayIfLocked: () => { if (!isUnlocked()) showOverlay(); },
        init: () => { startActivityTracking(); },
        verifyDummyPin,
        dummyExists
    };

    // Auto-start activity tracking and inactivity timer
    startActivityTracking();
    resetInactivityTimer();

})();
