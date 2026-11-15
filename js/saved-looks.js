// ============================================
// StyleSphere · Look storage (the ONLY look storage in the project)
// Used by Style Matcher, My Looks and (later) Style Studio.
//
// One canonical look format:
//   {
//     name:    "The Campus Edit",
//     score:   94,                                   // match %
//     items:   [ top, bottom, shoes, ... ],          // 2 to 5 pieces, each: { id, name, category, color,
//                                                    //   style, occasion, weather, image }
//                                                    // category: top | bottom | shoes | dress | outerwear | accessory
//     type:    "standard",                           // "standard" | "dress" | "layered"
//     hasAccessory: false,                           // true = the look includes an accessory ("complete")
//     filters: { occasion, weather, style },         // what the person asked for
//     key:     "1-9-16",                             // item ids, sorted. Same items = same look
//     savedAt: "2026-11-14T10:00:00.000Z"            // saved looks only
//   }
//
// type / hasAccessory come from the engine. Looks saved before they existed get them worked out
// from their items (see addLookMeta), so every look you read back has them.
//
// localStorage keys:
//   "savedLooks_v2" → array of looks the person saved (My Looks page)
//   "currentLook"   → the one look sent by "Try This Look" (for Style Studio)
//
// Saved looks are ALSO stored in MySQL (save_outfit.php / get_outfits.php / delete_outfit.php, see
// "Server sync" at the bottom). localStorage stays as the instant copy and the fallback.
// ============================================

const SAVED_KEY = "savedLooks_v2";
const CURRENT_KEY = "currentLook";

// v1 held looks built from the temporary sample wardrobe. Their item ids (1-20) would
// clash with real database ids, so the old list is discarded once.
try { localStorage.removeItem("savedLooks"); } catch (e) {}

// A look's identity = the ids of its items, e.g. "1-9-16".
function lookKey(look) {
    return look.items.map(i => i.id).sort((a, b) => a - b).join("-");
}

// Work out type + hasAccessory from the items (same rules as the engine's buildOutfit):
// a dress outfit stays "dress", top + bottom + outerwear is "layered", otherwise "standard".
function deriveLookType(items) {
    const has = function (cat) { return items.some(i => i.category === cat); };
    if (has("dress")) return "dress";
    if (has("outerwear")) return "layered";
    return "standard";
}

// Make sure a look has type and hasAccessory. Values already on the look are kept;
// older looks (saved before these fields existed) get them worked out from their items.
function addLookMeta(look) {
    const items = Array.isArray(look.items) ? look.items : [];
    return {
        ...look,
        type: look.type || deriveLookType(items),
        hasAccessory: typeof look.hasAccessory === "boolean"
            ? look.hasAccessory
            : items.some(i => i.category === "accessory")
    };
}

// Keep only the canonical fields (drops engine internals such as "breakdown").
function toCanonicalLook(look, filters) {
    const meta = addLookMeta(look);
    return {
        name: look.name,
        score: look.score,
        items: look.items,
        type: meta.type,
        hasAccessory: meta.hasAccessory,
        filters: filters || look.filters || {},
        key: lookKey(look)
    };
}

// Pull the pieces out of a look.
// top, bottom and shoes are exactly as before (null when the look has none, e.g. a dress outfit).
// dress, outerwear and accessory are additional fields (null when the look has none).
function getLookParts(look) {
    const byCategory = function (cat) {
        return look.items.find(i => i.category === cat) || null;
    };
    return {
        top: byCategory("top"),
        bottom: byCategory("bottom"),
        shoes: byCategory("shoes"),
        dress: byCategory("dress"),
        outerwear: byCategory("outerwear"),
        accessory: byCategory("accessory")
    };
}

// ---------- Saved looks ----------
function getSavedLooks() {
    let list = [];
    try {
        list = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    } catch (e) {
        list = [];
    }
    if (!Array.isArray(list)) list = [];

    // add a key (and type / hasAccessory) to older entries and drop duplicates
    const seen = new Set();
    return list
        .filter(l => l && Array.isArray(l.items))
        .map(l => addLookMeta({ ...l, key: l.key || lookKey(l) }))
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
        syncLookRemove(key);                       // also remove it from the database
        return false;
    }

    list.unshift({ ...toCanonicalLook(look, filters), savedAt: new Date().toISOString() });
    writeSavedLooks(list);
    syncLookSave(look, filters);                   // also save it to the database
    return true;
}

function removeSavedLook(key) {
    writeSavedLooks(getSavedLooks().filter(l => l.key !== key));
}

function clearSavedLooks() {
    writeSavedLooks([]);
}

// ---------- Current look ("Try This Look") ----------
// Style Studio reads this with getCurrentLook(), then getLookParts(look)
// gives { top, bottom, shoes, dress, outerwear, accessory } (null for any the look doesn't have).
function setCurrentLook(look, filters) {
    const payload = toCanonicalLook(look, filters);
    localStorage.setItem(CURRENT_KEY, JSON.stringify(payload));
    return payload;
}

function getCurrentLook() {
    try {
        const look = JSON.parse(localStorage.getItem(CURRENT_KEY));
        return look && Array.isArray(look.items) ? addLookMeta(look) : null;
    } catch (e) {
        return null;
    }
}

// Optional saved-count badge (does nothing on pages without an element with id="savedCount")
function updateSavedBadge() {
    const badge = document.getElementById("savedCount");
    if (!badge) return;
    const count = getSavedLooks().length;
    badge.textContent = count;
    badge.hidden = count === 0;
}

updateSavedBadge();

// ============================================
// Server sync (MySQL)  - added by Person 3
// save_outfit.php / get_outfits.php / delete_outfit.php
//
// localStorage above is the instant, offline copy. The database is the permanent copy that
// My Looks reads. Every call here is safe to fail: if the server can't be reached the look is
// still saved on this device and a warning is logged.
// ============================================

const OUTFIT_API = { save: "save_outfit.php", list: "get_outfits.php", remove: "delete_outfit.php" };
const OUTFIT_SLOTS = ["top", "bottom", "dress", "outerwear", "shoes", "accessory"];

// Result of the most recent save/remove sync, so a page can tell the person if it failed.
let lastLookSync = Promise.resolve({ ok: true, skipped: true });
function whenLookSynced() {
    return lastLookSync;
}

async function postOutfitJson(url, data) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    let body = null;
    try { body = await response.json(); } catch (e) { body = null; }
    if (!response.ok || !body || body.success !== true) {
        throw new Error((body && body.message) || ("HTTP " + response.status));
    }
    return body;
}

// What save_outfit.php expects. Returns null when the look contains anything that is not a real
// database item (for example a sample piece), so fake clothing is never sent to the server.
function lookToServerPayload(look, filters) {
    if (!look || !Array.isArray(look.items)) return null;

    const payload = {
        name: look.name || "My look",
        score: typeof look.score === "number" ? look.score : null,
        filters: filters || look.filters || {}
    };
    let count = 0;
    for (const slot of OUTFIT_SLOTS) {
        const item = look.items.find(i => i && i.category === slot);
        payload[slot + "_id"] = null;
        if (!item) continue;
        if (!Number.isInteger(item.id) || item.id < 1) return null;
        payload[slot + "_id"] = item.id;
        count++;
    }
    return count >= 2 ? payload : null;
}

function syncLookSave(look, filters) {
    const payload = lookToServerPayload(look, filters);
    if (!payload) {
        lastLookSync = Promise.resolve({ ok: true, skipped: true });
        return lastLookSync;
    }
    lastLookSync = postOutfitJson(OUTFIT_API.save, payload)
        .then(r => ({ ok: true, id: r.id }))
        .catch(e => { console.warn("Look not saved to the server:", e.message); return { ok: false, reason: e.message }; });
    return lastLookSync;
}

function syncLookRemove(key) {
    lastLookSync = postOutfitJson(OUTFIT_API.remove, { key: key })
        .then(() => ({ ok: true }))
        .catch(e => { console.warn("Look not removed from the server:", e.message); return { ok: false, reason: e.message }; });
    return lastLookSync;
}

// One row from get_outfits.php -> a look in the canonical format above.
function serverRowToLook(row) {
    if (typeof adaptClothes !== "function") throw new Error("stylesphere-adapter.js is not loaded");
    const items = adaptClothes(row.items || []);
    const look = {
        serverId: row.id,
        name: row.name || "Untitled look",
        items: items,
        filters: row.filters || {},
        savedAt: row.saved_at ? String(row.saved_at).replace(" ", "T") : undefined
    };
    if (typeof row.score === "number") look.score = row.score;       // only when a score exists
    look.key = items.length ? lookKey(look) : String(row.key || "");
    return addLookMeta(look);
}

// All looks saved in the database (looks whose pieces were all deleted from the wardrobe are left out).
async function fetchServerLooks() {
    const response = await fetch(OUTFIT_API.list, { cache: "no-store" });
    let body = null;
    try { body = await response.json(); } catch (e) { body = null; }
    if (!response.ok || !body || body.success !== true || !Array.isArray(body.outfits)) {
        throw new Error((body && body.message) || ("HTTP " + response.status));
    }
    return body.outfits.map(serverRowToLook).filter(l => l.items.length > 0);
}

async function deleteServerLook(id) {
    return postOutfitJson(OUTFIT_API.remove, { id: id });
}

async function deleteServerLookByKey(key) {
    return postOutfitJson(OUTFIT_API.remove, { key: key });
}

async function deleteAllServerLooks() {
    return postOutfitJson(OUTFIT_API.remove, { all: true });
}

// Looks saved on this device before the database existed (or while the server was down) are sent
// up once. Returns how many were added. Anything the server refuses is skipped quietly.
async function syncLocalLooksToServer(serverKeys) {
    let added = 0;
    for (const look of getSavedLooks()) {
        if (serverKeys.has(look.key)) continue;
        const payload = lookToServerPayload(look, look.filters);
        if (!payload) continue;
        try {
            const r = await postOutfitJson(OUTFIT_API.save, payload);
            if (!r.already_saved) added++;
        } catch (e) {
            console.warn("Could not upload a local look:", e.message);
        }
    }
    return added;
}
