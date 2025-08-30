// Notes App module

(function notesAppModule() {
    const NOTES_KEY = 'notes_app_v1';
    const lockPanel = document.getElementById('lock-panel');

    function loadNotesFromStorage() {
        try {
            const raw = localStorage.getItem(NOTES_KEY);
            if (!raw) return [];
            return JSON.parse(raw);
        } catch (e) {
            console.error('Failed to parse notes:', e);
            return [];
        }
    }
    
    function saveNotesToStorage(notes) {
        localStorage.setItem(NOTES_KEY, JSON.stringify(notes || []));
    }

    function createNoteObject() {
        return {
            id: Date.now() + Math.floor(Math.random() * 999),
            title: 'Untitled',
            content: '',
            updatedAt: new Date().toISOString()
        };
    }

    window.openNotesMode = function openNotesMode() {
        const notes = loadNotesFromStorage();

        if (!notes || notes.length === 0) {
            const sample = createNoteObject();
            sample.title = 'Weekly Assignments';
            sample.content = 'DUE NEXT WEDNESDAY: ';
            notes.push(sample);
            saveNotesToStorage(notes);
        }

        lockPanel.innerHTML = `
            <div class="notes-app w-full">
                <div class="flex gap-4">
                    <div class="notes-sidebar w-1/3 border-r pr-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-lg font-semibold">Notes</h3>
                            <div class="flex gap-2">
                                <button id="notes-new" class="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700">New</button>
                                <button id="notes-close" class="px-3 py-1 text-sm rounded bg-gray-600 hover:bg-gray-700">Close</button>
                            </div>
                        </div>
                        <input id="notes-search" placeholder="Search..." class="w-full mb-3 p-2 rounded bg-dark-700 border border-dark-500 text-sm" />
                        <div id="notes-list" style="max-height:420px;overflow:auto;"></div>
                    </div>
                    <div class="notes-editor flex-1 pl-4">
                        <div class="flex items-center justify-between mb-3">
                            <input id="note-title" class="text-xl p-2 rounded bg-dark-800 border border-dark-500 w-3/4" placeholder="Title" />
                            <div class="flex gap-2">
                                <button id="note-delete" class="px-3 py-1 text-sm rounded bg-red-600 hover:bg-red-700">Delete</button>
                                <button id="note-save" class="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700">Save</button>
                            </div>
                        </div>
                        <textarea id="note-content" class="w-full h-72 p-3 rounded bg-dark-700 border border-dark-500" placeholder="Write your note..."></textarea>
                        <div id="note-meta" class="text-xs text-gray-400 mt-2"></div>
                    </div>
                </div>
            </div>
        `;

        const notesListEl = document.getElementById('notes-list');
        const titleEl = document.getElementById('note-title');
        const contentEl = document.getElementById('note-content');
        const saveBtn = document.getElementById('note-save');
        const deleteBtn = document.getElementById('note-delete');
        const newBtn = document.getElementById('notes-new');
        const closeBtn = document.getElementById('notes-close');
        const searchEl = document.getElementById('notes-search');
        const metaEl = document.getElementById('note-meta');

        let notesState = loadNotesFromStorage();
        let currentNoteId = notesState[0] && notesState[0].id;

        function renderList(filter = '') {
            const f = filter.trim().toLowerCase();
            notesListEl.innerHTML = '';
            const ordered = notesState.slice().sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
            ordered.forEach(n => {
                if (f && !(n.title + ' ' + n.content).toLowerCase().includes(f)) return;
                const item = document.createElement('div');
                item.className = 'note-item p-2 mb-2 rounded hover:bg-dark-800 cursor-pointer border border-dark-600';
                item.dataset.id = n.id;
                item.innerHTML = `<div class="flex justify-between items-start"><strong>${window.escapeHtml(n.title || 'Untitled')}</strong><span class="text-xs text-gray-400">${new Date(n.updatedAt).toLocaleString()}</span></div>
                                  <div class="text-sm text-gray-400 truncate mt-1">${window.escapeHtml(n.content || '')}</div>`;
                item.addEventListener('click', () => {
                    loadNoteIntoEditor(n.id);
                });
                notesListEl.appendChild(item);
            });
            highlightSelected();
        }

        function loadNoteIntoEditor(id) {
            const note = notesState.find(x => x.id === Number(id));
            if (!note) return;
            currentNoteId = note.id;
            titleEl.value = note.title;
            contentEl.value = note.content;
            metaEl.textContent = `Last edited: ${new Date(note.updatedAt).toLocaleString()}`;
            highlightSelected();
        }

        function highlightSelected() {
            const items = Array.from(document.querySelectorAll('.note-item'));
            items.forEach(el => el.classList.toggle('bg-dark-900', Number(el.dataset.id) === Number(currentNoteId)));
        }

        function persistState() {
            saveNotesToStorage(notesState);
            renderList(searchEl.value || '');
        }

        function saveCurrentNote() {
            if (!currentNoteId) return;
            const idx = notesState.findIndex(x => x.id === Number(currentNoteId));
            if (idx === -1) return;
            notesState[idx].title = titleEl.value || 'Untitled';
            notesState[idx].content = contentEl.value || '';
            notesState[idx].updatedAt = new Date().toISOString();
            persistState();
            metaEl.textContent = `Saved: ${new Date(notesState[idx].updatedAt).toLocaleString()}`;
        }

        function deleteCurrentNote() {
            if (!currentNoteId) return;
            if (!confirm('Delete this note?')) return;
            notesState = notesState.filter(x => x.id !== Number(currentNoteId));
            if (notesState.length === 0) {
                const n = createNoteObject();
                notesState.push(n);
            }
            currentNoteId = notesState[0].id;
            persistState();
            loadNoteIntoEditor(currentNoteId);
        }

        let autosaveTimer = null;
        function scheduleAutosave() {
            clearTimeout(autosaveTimer);
            autosaveTimer = setTimeout(() => {
                if (currentNoteId) {
                    saveCurrentNote();
                }
            }, 700);
        }

        newBtn.addEventListener('click', () => {
            const n = createNoteObject();
            notesState.unshift(n);
            currentNoteId = n.id;
            persistState();
            loadNoteIntoEditor(currentNoteId);
            titleEl.focus();
        });

        saveBtn.addEventListener('click', () => {
            saveCurrentNote();
        });

        deleteBtn.addEventListener('click', () => {
            deleteCurrentNote();
        });

        closeBtn.addEventListener('click', () => {
            window.location.reload();
        });

        titleEl.addEventListener('input', scheduleAutosave);
        contentEl.addEventListener('input', scheduleAutosave);
        searchEl.addEventListener('input', () => renderList(searchEl.value || ''));

        renderList();
        loadNoteIntoEditor(currentNoteId);
    };

    document.addEventListener('dummyPinMatched', (e) => {
        window.openNotesMode && window.openNotesMode();
    });
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {};
}
