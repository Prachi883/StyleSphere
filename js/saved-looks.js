// ============================================
// StyleSphere · Saved Looks helper
// Shared by Style Matcher and My Looks.
// Saved looks live in the browser's localStorage under "savedLooks".
// Later this can be swapped for save_look.php / get_looks.php.
// ============================================

const SAVED_KEY = "savedLooks";

// A look's identity = the ids of its items, e.g. "1-9-16".
// Same 3 items = same look, so it can never be saved twice.
function lookKey(look) {
    return look.items.map(i => i.id).sort((a, b) => a - b).join("-");
}

function getSavedLooks() {
    let list = [];
    try {
        list = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    } catch (e) {
        list = [];
    }

    // add a key to older entries and drop duplicates
    const seen = new Set();
    return list
        .map(l => ({ ...l, key: l.key || lookKey(l) }))
        .filter(l => {
            if (seen.has(l.key)) return false;
            seen.add(l.key);
            return true;
        });
}

function writeSavedLooks(list) {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
    updateSavedBadge();
}

function isLookSaved(look) {
    const key = lookKey(look);
    return getSavedLooks().some(l => l.key === key);
}

// Saves the look, or un-saves it if it was already saved.
// Returns true if the look is saved after the call.
function toggleSaveLook(look, filters) {
    const key = lookKey(look);
    const list = getSavedLooks();

    if (list.some(l => l.key === key)) {
        writeSavedLooks(list.filter(l => l.key !== key));
        return false;
    }

    list.unshift({ ...look, key: key, filters: filters, savedAt: new Date().toISOString() });
    writeSavedLooks(list);
    return true;
}

function removeSavedLook(key) {
    writeSavedLooks(getSavedLooks().filter(l => l.key !== key));
}

function clearSavedLooks() {
    writeSavedLooks([]);
}

// Little number on the bookmark icon in the navbar
function updateSavedBadge() {
    const badge = document.getElementById("savedCount");
    if (!badge) return;
    const count = getSavedLooks().length;
    badge.textContent = count;
    badge.hidden = count === 0;
}

updateSavedBadge();