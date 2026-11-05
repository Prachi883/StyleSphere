// ============================================
// StyleSphere · Style Matcher (page logic)
// Needs, loaded before this file:
//   js/clothes-data.js           → const clothes
//   js/recommendation-engine.js  → generateOutfits(), COLOR_HEX
//   js/saved-looks.js            → isLookSaved(), toggleSaveLook()
// ============================================

const findOutfitBtn = document.getElementById("findOutfitBtn");
const resultsSection = document.getElementById("results");
const resultsTitle = document.getElementById("resultsTitle");
const cardsContainer = document.getElementById("cardsContainer");

const FIND_BTN_HTML = findOutfitBtn.innerHTML;   // remembered so we can restore it after loading

// ---------- 1. Chip selection ----------
// Clicking a chip highlights it and writes its value into the hidden <input>
document.querySelectorAll(".option-row").forEach(function (row) {
    const hiddenInput = document.getElementById(row.dataset.target);

    row.querySelectorAll(".chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
            row.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            hiddenInput.value = chip.dataset.value;
        });
    });
});

// ---------- 2. Get the clothes ----------
// Right now: the temporary array from clothes-data.js.
// Later, when Riyanshi's backend is ready, swap the body for:
//   return fetch("get_clothes.php").then(response => response.json());
async function loadClothes() {
    return clothes;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

    // wait for the clothes AND at least 0.9s, so the loading state doesn't just flash
    const results = await Promise.all([loadClothes(), wait(900)]);
    const wardrobe = results[0];

    // does the wardrobe even have a top, a bottom and shoes?
    const missing = ["top", "bottom", "shoes"].filter(function (cat) {
        return !wardrobe.some(item => item.category === cat);
    });

    const recommendations = generateOutfits(wardrobe, filters, 3);
    console.log("Recommendations:", recommendations);

    renderLooks(recommendations, filters, missing);

    findOutfitBtn.disabled = false;
    findOutfitBtn.innerHTML = FIND_BTN_HTML;
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
        // wardrobe has no tops / bottoms / shoes at all
        title = "Your wardrobe needs a few more pieces";
        message = "We need at least one top, one bottom and one pair of shoes to build an outfit. Missing: <strong>" + missing.join(", ") + "</strong>.";
        buttons = `<a href="wardrobe.html" class="cta cta-link">Add to my wardrobe <span class="arrow">→</span></a>`;
    } else {
        // wardrobe is fine, but nothing scores well for these choices
        title = "No strong matches yet";
        message = "Nothing in your wardrobe is a great fit for <strong>" + filters.occasion + " · " + filters.weather + " · " + filters.style +
                  "</strong>. Try different options, or add a few more pieces.";
        buttons = `
            <button type="button" class="cta" id="tryAgainBtn">Try different options</button>
            <a href="wardrobe.html" class="text-btn">Add to my wardrobe</a>`;
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
            const swatch = COLOR_HEX[item.color] || "#e5d8c8";
            return `<div class="look-tile" title="${item.name}"
                         style="background-color:${swatch}; background-image:url('${item.image}')"></div>`;
        }).join("");

        card.innerHTML = `
            <div class="look-number">0${index + 1}</div>
            <div class="look-image">${tiles}</div>
            <p class="look-title">${look.name.toUpperCase()}</p>
            <p class="look-items">${look.items.map(i => i.name).join("<br>")}</p>
            <p class="look-tags">${filters.occasion} · ${filters.weather} · ${filters.style}</p>
            <div class="match-score">${look.score}%</div>
            <p class="match-label">MATCH SCORE</p>
            <button type="button" class="card-btn primary" data-action="try">TRY THIS LOOK</button>
            <button type="button" class="card-btn ghost" data-action="save">SAVE LOOK</button>
        `;

        // TRY THIS LOOK → remember it (with the filters) for Style Studio
        card.querySelector('[data-action="try"]').addEventListener("click", function () {
            localStorage.setItem("currentLook", JSON.stringify({ ...look, filters: filters }));
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