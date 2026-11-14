// ============================================
// StyleSphere · Style Matcher (page logic)
// Needs, loaded before this file:
//   js/recommendation-engine.js  → generateOutfits(), COLOR_HEX
//   js/stylesphere-adapter.js    → adaptClothes(), ssEscape(), ssTileStyle()
//   js/saved-looks.js            → isLookSaved(), toggleSaveLook(), setCurrentLook()
//
// Everything is wrapped in a function so the names here (loadClothes, etc.)
// can never collide with the ones in app.js.
// ============================================

(function () {

const findOutfitBtn = document.getElementById("findOutfitBtn");
const resultsSection = document.getElementById("results");
const resultsTitle = document.getElementById("resultsTitle");
const cardsContainer = document.getElementById("cardsContainer");

const FIND_BTN_HTML = findOutfitBtn.innerHTML;   // remembered so we can restore it after loading

// ---------- 1. Chip selection ----------
// Clicking a chip highlights it and writes its value into the hidden <input>
document.querySelectorAll(".option-row").forEach(function (row) {
    const hiddenInput = document.getElementById(row.dataset.target);

    row.querySelectorAll(".sm-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
            row.querySelectorAll(".sm-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            hiddenInput.value = chip.dataset.value;
        });
    });
});

// ---------- 2. Get the clothes ----------
// Real wardrobe from MySQL via fetch_clothing.php, converted by the adapter.
// If the request fails we throw, and the click handler shows an error with a retry button
// (we never show made-up items in place of the real wardrobe).
async function loadClothes() {
    const response = await fetch("fetch_clothing.php", { cache: "no-store" });
    if (!response.ok) throw new Error("fetch_clothing.php answered HTTP " + response.status);

    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error("Unexpected response from fetch_clothing.php");

    const items = adaptClothes(rows);
    console.log("Wardrobe from database:", rows.length, "rows →", items.length, "usable items");
    return items;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Can the wardrobe make at least one outfit?
//   standard outfit: top + bottom + shoes
//   dress outfit:    dress + shoes
// Returns [] when at least one of these is possible, otherwise a list of what is still missing.
function getMissingPieces(wardrobe) {
    const has = function (cat) { return wardrobe.some(item => item.category === cat); };
    const hasShoes = has("shoes");
    const hasDress = has("dress");
    const hasTop = has("top");
    const hasBottom = has("bottom");

    if (hasShoes && (hasDress || (hasTop && hasBottom))) return [];

    const missing = [];
    if (!hasShoes) missing.push("shoes");
    if (!hasDress) {
        if (hasTop && !hasBottom)      missing.push("a bottom (or a dress)");
        else if (hasBottom && !hasTop) missing.push("a top (or a dress)");
        else if (!hasTop && !hasBottom) missing.push("a dress, or a top + a bottom");
    }
    return missing;
}

// ---------- 3. Find My Outfit ----------
findOutfitBtn.addEventListener("click", async function () {

    const occasion = document.getElementById("occasion").value;
    const weather = document.getElementById("weather").value;
    const style = document.getElementById("style").value;
    const filters = { occasion, weather, style };

    console.log("Occasion:", occasion);
    console.log("Weather:", weather);
    console.log("Style:", style);

    showLoading();

    try {
        // wait for the clothes AND at least 0.9s, so the loading state doesn't just flash
        const results = await Promise.all([loadClothes(), wait(900)]);
        const wardrobe = results[0];

        // can the wardrobe even make an outfit? (top + bottom + shoes, or dress + shoes)
        const missing = getMissingPieces(wardrobe);

        const recommendations = generateOutfits(wardrobe, filters, 3);
        console.log("Recommendations:", recommendations);

        renderLooks(recommendations, filters, missing);
    } catch (error) {
        console.error("Style Matcher error:", error);
        resultsTitle.textContent = "We couldn't load your wardrobe";
        cardsContainer.innerHTML = `
            <div class="empty-state">
                <p class="empty-text">Something went wrong while fetching your clothes. Check that the server is running, then try again.</p>
                <div class="empty-actions">
                    <button type="button" class="cta" id="retryBtn">Try again</button>
                </div>
            </div>`;
        document.getElementById("retryBtn").addEventListener("click", function () {
            findOutfitBtn.click();
        });
    } finally {
        // always give the button back, whatever happened
        findOutfitBtn.disabled = false;
        findOutfitBtn.innerHTML = FIND_BTN_HTML;
    }
});

// ---------- 4. Loading state ----------
function showLoading() {
    findOutfitBtn.disabled = true;
    findOutfitBtn.innerHTML = "Styling your looks…";

    resultsTitle.textContent = "Finding your looks…";
    resultsSection.hidden = false;

    // three shimmering placeholder cards
    cardsContainer.innerHTML = [1, 2, 3].map(function () {
        return `
            <article class="look-card skeleton">
                <div class="sk sk-line short"></div>
                <div class="sk sk-tiles"></div>
                <div class="sk sk-line mid"></div>
                <div class="sk sk-line short"></div>
                <div class="sk sk-score"></div>
                <div class="sk sk-btn"></div>
                <div class="sk sk-btn"></div>
            </article>`;
    }).join("");

    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- 5. Empty states ----------
function renderEmpty(filters, missing) {
    let title, message, buttons;

    if (missing.length > 0) {
        // wardrobe can't make any outfit yet
        title = "Your wardrobe needs a few more pieces";
        message = "To build an outfit we need shoes, plus either a dress or a top and a bottom. Still missing: <strong>" + missing.join(" · ") + "</strong>.";
        buttons = `<a href="wardrobe.php" class="cta cta-link">Add to my wardrobe <span class="arrow">→</span></a>`;
    } else {
        // wardrobe is fine, but nothing scores well for these choices
        title = "No strong matches yet";
        message = "Nothing in your wardrobe is a great fit for <strong>" + filters.occasion + " · " + filters.weather + " · " + filters.style +
                  "</strong>. Try different options, or add a few more pieces.";
        buttons = `
            <button type="button" class="cta" id="tryAgainBtn">Try different options</button>
            <a href="wardrobe.php" class="text-btn">Add to my wardrobe</a>`;
    }

    resultsTitle.textContent = title;
    cardsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5a2.2 2.2 0 1 0-2.2-2.2"/><path d="M12 6.5v2.2L21 15.5a1.2 1.2 0 0 1-.7 2.2H3.7A1.2 1.2 0 0 1 3 15.5l9-6.8"/></svg>
            </div>
            <p class="empty-text">${message}</p>
            <div class="empty-actions">${buttons}</div>
        </div>`;

    const tryAgain = document.getElementById("tryAgainBtn");
    if (tryAgain) {
        tryAgain.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
}

// ---------- 6. Render outfit cards ----------
function renderLooks(looks, filters, missing) {
    cardsContainer.innerHTML = "";

    if (looks.length === 0) {
        renderEmpty(filters, missing || []);
        return;
    }
    resultsTitle.textContent = looks.length === 3 ? "Your top 3 looks" : "Your top " + (looks.length === 1 ? "look" : looks.length + " looks");

    looks.forEach(function (look, index) {
        const card = document.createElement("article");
        card.className = "look-card";
        card.style.animationDelay = (index * 0.12) + "s";

        // one tile per clothing item: the photo if it exists, otherwise a color swatch
        const tiles = look.items.map(function (item) {
            return `<div class="look-tile" title="${ssEscape(item.name)}" style="${ssTileStyle(item)}"></div>`;
        }).join("");

        card.innerHTML = `
            <div class="look-number">0${index + 1}</div>
            <div class="look-image">${tiles}</div>
            <p class="look-title">${ssEscape(look.name.toUpperCase())}</p>
            <p class="look-items">${look.items.map(i => ssEscape(i.name)).join("<br>")}</p>
            <p class="look-tags">${filters.occasion} · ${filters.weather} · ${filters.style}</p>
            <div class="match-score">${look.score}%</div>
            <p class="match-label">MATCH SCORE</p>
            <button type="button" class="card-btn primary" data-action="try">TRY THIS LOOK</button>
            <button type="button" class="card-btn ghost" data-action="save">SAVE LOOK</button>
        `;

        // TRY THIS LOOK → remember it (with the filters) for Style Studio
        card.querySelector('[data-action="try"]').addEventListener("click", function () {
            setCurrentLook(look, filters);
            console.log("Try this look:", look);
            // When Style Studio exists, add:  window.location.href = "style-studio.html";
        });

        // SAVE LOOK → toggles: saves the look, click again to un-save.
        // Saving the same outfit twice is impossible (see lookKey in saved-looks.js).
        const saveBtn = card.querySelector('[data-action="save"]');

        function showSaveState(saved) {
            saveBtn.textContent = saved ? "SAVED ✓" : "SAVE LOOK";
            saveBtn.classList.toggle("saved", saved);
        }

        showSaveState(isLookSaved(look));   // already saved earlier? show it

        saveBtn.addEventListener("click", function () {
            showSaveState(toggleSaveLook(look, filters));
        });

        cardsContainer.appendChild(card);
    });
}

})();