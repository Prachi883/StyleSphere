// ============================================
// StyleSphere · My Looks page
// Needs: recommendation-engine.js (COLOR_HEX), stylesphere-adapter.js, saved-looks.js
// Wrapped in a function so its names never collide with app.js (which also has "activeFilter").
//
// Looks are read from the database (get_outfits.php). If the server can't be reached, the looks
// saved on this device are shown instead, with a note.
// ============================================

(function () {

const savedCards = document.getElementById("savedCards");
const filterChips = document.getElementById("looksFilterChips");
const emptyState = document.getElementById("emptyState");
const clearWrap = document.getElementById("clearWrap");
const looksSubtitle = document.getElementById("looksSubtitle");
const clearAllBtn = document.getElementById("clearAllBtn");

let activeFilter = "all";
let allLooks = [];          // the looks being shown
let fromServer = true;      // false = showing this device's copy because the server couldn't be reached

const DEVICE_NOTE = " The server couldn't be reached, so these are the looks saved on this device.";

// ---------- Load looks (database first) ----------
async function loadLooks() {
    looksSubtitle.textContent = "Loading your looks...";
    savedCards.innerHTML = "";
    emptyState.hidden = true;
    clearWrap.hidden = true;
    filterChips.innerHTML = "";

    try {
        let looks = await fetchServerLooks();

        // looks saved on this device earlier (or while the server was down) are sent up once
        const added = await syncLocalLooksToServer(new Set(looks.map(l => l.key)));
        if (added > 0) looks = await fetchServerLooks();

        allLooks = looks;
        fromServer = true;
    } catch (error) {
        console.warn("My Looks: using the looks saved on this device.", error);
        allLooks = getSavedLooks();
        fromServer = false;
    }
    render();
}

// ---------- Filter chips (All + each occasion you've saved) ----------
function renderFilters(looks) {
    const occasions = [...new Set(looks.map(l => l.filters && l.filters.occasion).filter(Boolean))];
    filterChips.innerHTML = "";

    // no point filtering if there's only one kind of look
    if (occasions.length < 2) {
        activeFilter = "all";
        return;
    }

    ["all", ...occasions].forEach(function (value) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "sm-chip" + (value === activeFilter ? " active" : "");
        chip.textContent = value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1);
        chip.addEventListener("click", function () {
            activeFilter = value;
            render();
        });
        filterChips.appendChild(chip);
    });
}

// ---------- Format "5 Nov" ----------
function formatDate(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function setStatus(text) {
    looksSubtitle.textContent = text;
}

// ---------- Draw everything ----------
function render() {
    const all = allLooks;
    renderFilters(all);

    const looks = activeFilter === "all"
        ? all
        : all.filter(l => l.filters && l.filters.occasion === activeFilter);

    savedCards.innerHTML = "";

    const isEmpty = all.length === 0;
    emptyState.hidden = !isEmpty;
    clearWrap.hidden = isEmpty;

    const deviceNote = fromServer ? "" : DEVICE_NOTE;
    setStatus(isEmpty
        ? "Every outfit you love, kept in one place." + deviceNote
        : all.length + (all.length === 1 ? " look" : " looks") + " saved \u2014 tap one to try it on in Style Studio." + deviceNote);

    looks.forEach(function (look, index) {
        const card = document.createElement("article");
        card.className = "look-card";
        card.style.animationDelay = (index * 0.08) + "s";

        const tiles = look.items.map(function (item) {
            return `<div class="look-tile" title="${ssEscape(item.name)}" style="${ssTileStyle(item)}"></div>`;
        }).join("");

        const f = look.filters || {};
        const tags = [f.occasion, f.weather, f.style].filter(Boolean).join(" · ");

        // the match score is only shown for looks that have one (looks made in Style Studio don't)
        const score = typeof look.score === "number"
            ? `<div class="match-score">${look.score}%</div><p class="match-label">MATCH SCORE</p>`
            : "";
        const saved = formatDate(look.savedAt);

        card.innerHTML = `
            <div class="look-number">0${index + 1}</div>
            <div class="look-image">${tiles}</div>
            <p class="look-title">${ssEscape(look.name.toUpperCase())}</p>
            <p class="look-items">${look.items.map(i => ssEscape(i.name)).join("<br>")}</p>
            <p class="look-tags">${ssEscape(tags)}</p>
            ${score}
            ${saved ? `<p class="look-date">SAVED ${ssEscape(saved.toUpperCase())}</p>` : ""}
            <button type="button" class="card-btn primary" data-action="try">TRY THIS LOOK</button>
            <button type="button" class="card-btn remove" data-action="remove">REMOVE</button>
        `;

        card.querySelector('[data-action="try"]').addEventListener("click", function () {
            setCurrentLook(look, look.filters);
            window.location.href = "style-studio.php";
        });

        card.querySelector('[data-action="remove"]').addEventListener("click", function () {
            removeLook(look, card);
        });

        savedCards.appendChild(card);
    });
}

// ---------- Remove one look: database first, then this device, then the page ----------
async function removeLook(look, card) {
    if (!confirm("Remove \u201C" + look.name + "\u201D from your looks?")) return;

    try {
        if (look.serverId) {
            await deleteServerLook(look.serverId);
        } else {
            // this device's copy only: also make sure the database doesn't still hold it
            try { await deleteServerLookByKey(look.key); } catch (e) { /* server may be down; fine */ }
        }
    } catch (error) {
        console.warn("My Looks: could not delete from the server.", error);
        setStatus("Couldn't remove that look. Check that the server is running, then try again.");
        return;
    }

    removeSavedLook(look.key);          // keeps the Style Matcher's "SAVED" buttons in step
    card.classList.add("removing");
    setTimeout(function () {
        allLooks = allLooks.filter(l => l.key !== look.key);
        render();
    }, 280);
}

clearAllBtn.addEventListener("click", async function () {
    if (!confirm("Remove all saved looks? This can't be undone.")) return;

    try {
        await deleteAllServerLooks();
    } catch (error) {
        console.warn("My Looks: could not clear the server.", error);
        setStatus("Couldn't remove your looks. Check that the server is running, then try again.");
        return;
    }
    clearSavedLooks();
    allLooks = [];
    activeFilter = "all";
    render();
});

loadLooks();

})();
