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
// Later this can be swapped for save_look.php / get_looks.php.
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
        return false;
    }

    list.unshift({ ...toCanonicalLook(look, filters), savedAt: new Date().toISOString() });
    writeSavedLooks(list);
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