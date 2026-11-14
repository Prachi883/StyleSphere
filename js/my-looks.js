// ============================================
// StyleSphere · My Looks page
// Needs: recommendation-engine.js (COLOR_HEX), stylesphere-adapter.js, saved-looks.js
// Wrapped in a function so its names never collide with app.js (which also has "activeFilter").
// ============================================

(function () {

const savedCards = document.getElementById("savedCards");
const filterChips = document.getElementById("looksFilterChips");
const emptyState = document.getElementById("emptyState");
const clearWrap = document.getElementById("clearWrap");
const looksSubtitle = document.getElementById("looksSubtitle");
const clearAllBtn = document.getElementById("clearAllBtn");

let activeFilter = "all";

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
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ---------- Draw everything ----------
function render() {
    const all = getSavedLooks();
    renderFilters(all);

    const looks = activeFilter === "all"
        ? all
        : all.filter(l => l.filters && l.filters.occasion === activeFilter);

    savedCards.innerHTML = "";

    const isEmpty = all.length === 0;
    emptyState.hidden = !isEmpty;
    clearWrap.hidden = isEmpty;

    looksSubtitle.textContent = isEmpty
        ? "Every outfit you love, kept in one place."
        : all.length + (all.length === 1 ? " look" : " looks") + " saved — tap one to try it on in Style Studio.";

    looks.forEach(function (look, index) {
        const card = document.createElement("article");
        card.className = "look-card";
        card.style.animationDelay = (index * 0.08) + "s";

        const tiles = look.items.map(function (item) {
            return `<div class="look-tile" title="${ssEscape(item.name)}" style="${ssTileStyle(item)}"></div>`;
        }).join("");

        const f = look.filters || {};
        const tags = [f.occasion, f.weather, f.style].filter(Boolean).join(" · ");

        card.innerHTML = `
            <div class="look-number">0${index + 1}</div>
            <div class="look-image">${tiles}</div>
            <p class="look-title">${ssEscape(look.name.toUpperCase())}</p>
            <p class="look-items">${look.items.map(i => ssEscape(i.name)).join("<br>")}</p>
            <p class="look-tags">${ssEscape(tags)}</p>
            <div class="match-score">${look.score}%</div>
            <p class="match-label">MATCH SCORE</p>
            <p class="look-date">SAVED ${formatDate(look.savedAt).toUpperCase()}</p>
            <button type="button" class="card-btn primary" data-action="try">TRY THIS LOOK</button>
            <button type="button" class="card-btn remove" data-action="remove">REMOVE</button>
        `;

        card.querySelector('[data-action="try"]').addEventListener("click", function () {
            setCurrentLook(look, look.filters);
            console.log("Try this look:", look);
            // Later: window.location.href = "style-studio.html";
        });

        card.querySelector('[data-action="remove"]').addEventListener("click", function () {
            card.classList.add("removing");
            setTimeout(function () {
                removeSavedLook(look.key);
                render();
            }, 280);
        });

        savedCards.appendChild(card);
    });
}

clearAllBtn.addEventListener("click", function () {
    if (confirm("Remove all saved looks? This can't be undone.")) {
        clearSavedLooks();
        activeFilter = "all";
        render();
    }
});

render();

})();