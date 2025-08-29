:root{
    --dark-900: #0a0a0a;
    --dark-800: #1a1a1a;
    --dark-700: #2a2a2a;
    --dark-600: #3a3a3a;
    --dark-500: #4a4a4a;

    --blue-500: #3b82f6;
    --blue-600: #2563eb;
    --blue-700: #1d4ed8;

    --green-600: #16a34a;
    --green-700: #15803d;

    --red-600: #dc2626;
    --red-700: #b91c1c;

    --muted: #9ca3af;
    --glass: rgba(255,255,255,0.03);

    --radius-lg: 12px;
    --shadow-xl: 0 10px 30px rgba(0,0,0,0.6);
}

* { box-sizing: border-box; }
html, body { height: 100%; }
body {
    margin: 0;
    padding: 0;
    font-family: 'Chakra Petch', monospace;
    background: var(--dark-900);
    color: #e5e7eb;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
}

.bg-dark-800 { background: var(--dark-800) !important; }
.bg-dark-700 { background: var(--dark-700) !important; }
.bg-dark-900 { background: var(--dark-900) !important; }

.auth-card, .bg-dark-800 {
    border-radius: var(--radius-lg);
    border: 1px solid var(--dark-600);
    box-shadow: var(--shadow-xl);
}

input[type="text"], input[type="password"], select, textarea {
    background: var(--dark-700);
    border: 1px solid var(--dark-500);
    color: #fff;
    border-radius: 10px;
    transition: box-shadow .15s ease, transform .12s ease;
}

input::placeholder, textarea::placeholder { color: #9ca3af; }

input:focus, select:focus, button:focus, textarea:focus {
    outline: none;
    box-shadow: 0 0 0 4px rgba(37,99,235,0.12);
}

button {
    cursor: pointer;
    border: none;
    border-radius: 10px;
    transition: transform .12s ease, background-color .12s ease, opacity .12s ease;
}
button:active { transform: translateY(1px); }
button[disabled] { opacity: 0.5; cursor: not-allowed; }

.fade-in { animation: fadeIn .45s ease-in-out both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.message-appear { animation: messageAppear .28s ease-out both; }
@keyframes messageAppear { from { opacity: 0; transform: translateX(-18px) scale(.975); } to { opacity: 1; transform: translateX(0) scale(1); } }

#messages-container { -webkit-overflow-scrolling: touch; }
#messages-container::-webkit-scrollbar { width: 8px; height: 8px; }
#messages-container::-webkit-scrollbar-track { background: var(--dark-800); }
#messages-container::-webkit-scrollbar-thumb { background: var(--dark-500); border-radius: 6px; border: 1px solid rgba(255,255,255,0.02); }
#messages-container::-webkit-scrollbar-thumb:hover { background: #6a6a6a; }

.hidden { display: none !important; }

.owner-shield {
    display: inline-flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; border-radius: 4px; background: var(--dark-800); color: #fff; font-size: 12px; font-weight: 600; margin-left: 6px;
}

.dm-badge { font-size: 11px; padding: 2px 6px; border-radius: 999px; background: rgba(255,255,255,0.03); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.03); margin-left: 6px; }

#auth-error { display: block; font-weight: 600; }

.message-item { padding: 8px 6px; border-radius: 10px; transition: background-color .12s ease; }
.message-item:hover { background: rgba(255,255,255,0.015); }

@media (max-width: 640px) {
    .message-item { padding: 10px; border-radius: 8px; }
}

.text-red-400 { color: #fca5a5 !important; }
.text-yellow-400 { color: #facc15 !important; }
.text-gray-400 { color: #9ca3af !important; }

.bg-blue-600 { background: var(--blue-600) !important; }
.bg-blue-700 { background: var(--blue-700) !important; }
.bg-green-600 { background: var(--green-600) !important; }
.bg-green-700 { background: var(--green-700) !important; }
.bg-red-600 { background: var(--red-600) !important; }
.bg-red-700 { background: var(--red-700) !important; }

#pin-modal {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, rgba(10,10,10,0.5), rgba(10,10,10,0.35));
    backdrop-filter: blur(6px);
    padding: 20px;
}
#pin-modal > div {
    background: #0a0a0a;
    border: 1px solid rgba(255,255,255,0.03);
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    border-radius: 18px;
}

#lock-overlay { display: none; }
#lock-overlay:not(.hidden) { display: block; position: fixed; inset: 0; z-index: 9999; }

#lock-overlay > .absolute { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.818); backdrop-filter: blur(50px); }

#lock-overlay .relative > .w-full {
    background: linear-gradient(180deg, var(--dark-800), var(--dark-700));
    border: 1px solid rgba(255,255,255,0.03);
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.7);
}

#pin-boxes {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin: 12px 0;
}

.pin-box {
    width: 4rem;
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    color: #fff;
    background: #181818;
    border: 1px solid var(--dark-600);
    border-radius: 12px;
    transition: transform .12s ease, background-color .12s ease, box-shadow .12s ease;
    user-select: none;
    -webkit-user-select: none;
}

@media (min-width: 768px) {
    .pin-box { width: 5rem; height: 5rem; font-size: 2rem; border-radius: 14px; }
}

.pin-box.filled {
    background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
    box-shadow: 0 4px 18px rgba(0,0,0,0.5) inset;
    transform: translateY(-2px);
}

@keyframes shakeX {
    0% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-6px); }
    80% { transform: translateX(6px); }
    100% { transform: translateX(0); }
}
#pin-boxes.shake { animation: shakeX .42s ease; }

#pin-hidden { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }

#unlock-msg { color: var(--muted); margin-top: 8px; min-height: 1em; }

@media (max-width: 420px) {
    #pin-boxes { gap: 8px; }
    .pin-box { width: 3.2rem; height: 3.2rem; font-size: 1.2rem; }
}

.pin-box:focus { outline: 2px solid rgba(99,102,241,0.12); outline-offset: 3px; }

#lock-overlay .relative { display: flex; align-items: center; justify-content: center; min-height: 100vh; }

#pin-setup-input, #pin-setup-confirm, #pin-dummy-input, #pin-dummy-confirm {
    letter-spacing: 6px;
}

#pin-modal button { border-radius: 10px; }

#pin-setup-msg, #unlock-msg { color: #9ca3af; }

.pin-box { cursor: text; }

.notes-app .notes-sidebar { min-width: 220px; }
.note-item { transition: background .12s ease; }
.note-item:hover { background: rgba(255,255,255,0.02); }
.notes-app input, .notes-app textarea, .notes-app button { font-family: inherit; color: #e6e6e6; }
.notes-app .notes-sidebar .note-item.bg-dark-900 { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.02); }
