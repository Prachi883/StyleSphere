/* ==========================================================
   StyleSphere | Style Studio
   Uses the team's look format from js/saved-looks.js:
     getCurrentLook(), getLookParts(look), toggleSaveLook(look, filters), isLookSaved(look)
   A look is { name, score, items: [...], type, filters, key }, where each item has a
   category: top | bottom | shoes | dress | outerwear | accessory (any number, any order).
   The mannequin is a stylized 2D preview, not a realistic try-on.
   Load order on the page: recommendation-engine.js, stylesphere-adapter.js, saved-looks.js, this file.
   ========================================================== */

(function () {
  "use strict";

  const CATEGORIES = [
    { id: "top", tab: "Tops", slot: "Top" },
    { id: "bottom", tab: "Bottoms", slot: "Bottom" },
    { id: "dress", tab: "Dresses", slot: "Dress" },
    { id: "outerwear", tab: "Outerwear", slot: "Outerwear" },
    { id: "shoes", tab: "Shoes", slot: "Shoes" },
    { id: "accessory", tab: "Accessories", slot: "Accessory" }
  ];
  const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
  const SAVE_ORDER = ["top", "bottom", "dress", "shoes", "outerwear", "accessory"];

  const FALLBACK_COLOR = "#D2B995";
  const NOTE_DEFAULT = "A stylized preview. Garments are illustrations in your item colours.";
  // Used only if the engine's COLOR_HEX is not on the page.
  const LOCAL_HEX = {
    white: "#f4f1ec", black: "#25201f", grey: "#9a9593", beige: "#d8c3a5", cream: "#efe3cf",
    blue: "#5b7aa3", brown: "#7a5841", olive: "#7d7a4f", pink: "#e8aab8", burgundy: "#6b2737",
    red: "#b03a3a", green: "#5f8466", yellow: "#e6c65a", purple: "#8a6aa8", orange: "#d98a4a"
  };

  // Offline fallback only (used when fetch_clothing.php can't be reached). They can't be saved.
  const sample = (id, name, category, color) => ({ id: "sample-" + id, name, category, color, sample: true });
  const SAMPLE_ITEMS = [
    sample("t1", "Ivory silk blouse", "top", "cream"), sample("t2", "Camel knit sweater", "top", "beige"),
    sample("t3", "Espresso turtleneck", "top", "brown"),
    sample("b1", "Cream wide-leg trousers", "bottom", "cream"), sample("b2", "Chocolate pleated skirt", "bottom", "brown"),
    sample("b3", "Dark denim straight jeans", "bottom", "blue"),
    sample("d1", "Olive midi dress", "dress", "olive"), sample("d2", "Black slip dress", "dress", "black"),
    sample("o1", "Camel wool coat", "outerwear", "beige"), sample("o2", "Black blazer", "outerwear", "black"),
    sample("s1", "Caramel leather loafers", "shoes", "brown"), sample("s2", "Ivory ballet flats", "shoes", "cream"),
    sample("s3", "Espresso ankle boots", "shoes", "brown"),
    sample("a1", "Gold chain necklace", "accessory", "yellow")
  ];

  // ---------- State ----------
  const outfit = { top: null, bottom: null, dress: null, outerwear: null, shoes: null, accessory: null };
  let activeCategory = "top";
  let catalog = null;       // { category: [items] } once the wardrobe has loaded
  let usingSamples = false;
  let loadedLook = null;    // the look received from Style Matcher / My Looks, if any

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const tabsEl = $("categoryTabs");
  const listEl = $("itemList");
  const detailEl = $("detailList");
  const progressEl = $("progress");
  const noteEl = $("stageNote");
  const nameEl = $("lookName");
  const saveBtn = $("saveBtn");
  const toastEl = $("toast");
  const zones = document.querySelectorAll(".zone");

  // ---------- Item helpers ----------
  // Items carry a colour NAME ("beige"); the mannequin and swatches need hex.
  function colorOf(item) {
    const c = String((item && item.color) || "").trim().toLowerCase();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(c)) return c;
    const map = typeof COLOR_HEX !== "undefined" && COLOR_HEX ? COLOR_HEX : LOCAL_HEX;
    return map[c] || LOCAL_HEX[c] || FALLBACK_COLOR;
  }
  const toneOf = (item) => {
    const c = String((item && item.color) || "").trim();
    return c && c.charAt(0) !== "#" ? c.charAt(0).toUpperCase() + c.slice(1) : "";
  };
  const sameItem = (a, b) => !!a && !!b && String(a.id) === String(b.id);

  function makeSwatch(item) {
    const s = document.createElement("span");
    s.className = "swatch";
    s.style.background = colorOf(item);
    return s;
  }

  // ---------- Mannequin garments ----------
  // Stylized 2D SVG shapes drawn in each item's saved colour. Not a realistic try-on.
  // Garment type comes from the item's name (the data has no garment-type field).
  const SKIN = "#F4EADA";
  const hexOf = (c) => (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c || "") ? c : FALLBACK_COLOR);

  function isDark(hex) {
    let h = hex.slice(1);
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    const n = parseInt(h, 16);
    return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 90;
  }
  // Detail colours that stay visible on both light and dark garments.
  const ink = (c) => (isDark(c)
    ? { line: "rgba(255,255,255,.3)", shade: "rgba(255,255,255,.09)" }
    : { line: "rgba(43,29,22,.3)", shade: "rgba(43,29,22,.12)" });

  const mirror = (s) => '<g transform="translate(300 0) scale(-1 1)">' + s + "</g>"; // left -> right
  const fill = (d, c) => '<path class="garment" d="' + d + '" fill="' + c + '"/>';
  const line = (d, col) => '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="1.2" stroke-linecap="round"/>';
  const shade = (d, col) => '<path d="' + d + '" fill="' + col + '"/>';

  // Sleeves (left side only; mirrored for the right). Arms are drawn between body and sleeves.
  const SLV = {
    short: "M107 121 Q80 128 75 160 L73 182 L97 190 L103 150 Z",
    fit:   "M107 121 Q80 128 75 160 L69 262 L92 266 L102 190 L103 150 Z",
    loose: "M107 121 Q74 130 68 166 L60 258 Q76 270 94 262 L102 190 L104 150 Z",
    bulky: "M107 120 Q76 128 71 160 L64 266 L94 270 L102 190 L104 150 Z"
  };
  const cuff = (k) => mirror(line("M68.5 256 L92.5 260", k.line));
  const NECK = "M138 116 Q150 130 162 116";

  const TOPS = {
    tee: (c, k) => ({
      body: fill("M106 122 Q128 114 140 116 Q150 128 160 116 Q172 114 194 122 L204 160 L196 258 Q150 268 104 258 L96 160 Z", c) + line(NECK, k.line),
      sleeves: fill(SLV.short, c) + mirror(fill(SLV.short, c))
    }),
    tank: (c, k) => ({
      body: fill("M122 116 L132 118 Q150 138 168 118 L178 116 L184 130 L198 160 L194 256 Q150 264 106 256 L102 160 L116 130 Z", c),
      sleeves: ""
    }),
    blouse: (c, k) => ({
      body: fill("M105 121 Q150 112 195 121 L206 165 Q210 215 204 262 Q150 276 96 262 Q90 215 94 165 Z", c) +
            shade("M137 114 L150 142 L163 114 Z", SKIN) + line("M137 114 L150 142 L163 114", k.line) +
            line("M116 160 Q150 178 184 160", k.line) + line("M112 215 Q150 232 188 215", k.line),
      sleeves: fill(SLV.loose, c) + mirror(fill(SLV.loose, c)) + cuff(k) + line("M68 256 L92 260", k.line)
    }),
    shirt: (c, k) => ({
      body: fill("M105 121 Q150 112 195 121 L204 160 L198 270 Q150 280 102 270 L96 160 Z", c) +
            line("M150 130 L150 272", k.line) +
            [150, 180, 210, 240].map((y) => '<circle cx="150" cy="' + y + '" r="1.8" fill="rgba(255,255,255,.6)" stroke="' + k.line + '" stroke-width=".8"/>').join("") +
            fill("M134 112 L151 128 L140 140 L124 124 Z", c) + fill("M166 112 L149 128 L160 140 L176 124 Z", c),
      sleeves: fill(SLV.fit, c) + mirror(fill(SLV.fit, c)) + cuff(k) + line("M68.5 256 L92.5 260", k.line)
    }),
    sweater: (c, k) => ({
      body: fill("M105 120 Q150 112 195 120 L206 160 L200 262 Q150 272 100 262 L94 160 Z", c) +
            shade("M100 256 Q150 266 200 256 L200 262 Q150 272 100 262 Z", k.shade) +
            line("M137 115 Q150 131 163 115", k.line) + line("M140 118 Q150 131 160 118", k.line),
      sleeves: fill(SLV.bulky, c) + mirror(fill(SLV.bulky, c)) +
               shade("M64.5 258 L94 262 L94 270 L64 266 Z", k.shade) + mirror(shade("M64.5 258 L94 262 L94 270 L64 266 Z", k.shade))
    }),
    turtleneck: (c, k) => ({
      body: fill("M105 121 Q150 112 195 121 L202 160 L195 256 Q150 264 105 256 L98 160 Z", c) +
            fill("M137 90 L163 90 L166 117 Q150 126 134 117 Z", c) +
            line("M138 99 L162 99", k.line) + line("M137 108 L163 108", k.line),
      sleeves: fill(SLV.fit, c) + mirror(fill(SLV.fit, c)) + cuff(k) + line("M68.5 256 L92.5 260", k.line)
    })
  };

  const WAIST = "M104 248 Q150 258 196 248 L196 258 Q150 268 104 258 Z";
  const BOTTOMS = {
    trousers: (c, k) =>
      fill("M104 248 Q150 258 196 248 L203 300 L188 496 L159 496 L150 322 L141 496 L112 496 L97 300 Z", c) +
      shade(WAIST, k.shade) + line("M126 262 L128 494", k.line) + mirror(line("M126 262 L128 494", k.line)),
    wide: (c, k) =>
      fill("M104 248 Q150 258 196 248 L206 300 L212 498 L160 498 L150 322 L140 498 L88 498 L94 300 Z", c) +
      shade(WAIST, k.shade) + line("M120 262 L108 494", k.line) + mirror(line("M120 262 L108 494", k.line)),
    jeans: (c, k) =>
      fill("M104 248 Q150 258 196 248 L202 300 L186 496 L159 496 L150 324 L141 496 L114 496 L98 300 Z", c) +
      shade(WAIST, k.shade) + line("M150 258 L150 324", k.line) +
      line("M112 262 Q124 274 133 264", k.line) + mirror(line("M112 262 Q124 274 133 264", k.line)) +
      line("M101 300 L117 494", k.line) + mirror(line("M101 300 L117 494", k.line)) +
      line("M115 488 L141 488", k.line) + mirror(line("M115 488 L141 488", k.line)),
    shorts: (c, k) =>
      fill("M104 248 Q150 258 196 248 L203 300 L199 346 L151 349 L150 324 L149 349 L101 346 L97 300 Z", c) +
      shade(WAIST, k.shade) + line("M101 340 L149 343", k.line) + mirror(line("M101 340 L149 343", k.line)),
    skirt: (c, k, item) => {
      const mini = /mini/i.test(item.name);
      const hem = mini ? 346 : 400, grow = mini ? 0.17 : 0.39;
      const out = mini ? 8 : 18;
      let pleats = "";
      for (let i = 0; i < 5; i++) {
        const xw = 122 + i * 14, xh = 150 + (xw - 150) * (1 + grow);
        pleats += line("M" + xw + " 262 L" + xh.toFixed(1) + " " + (hem + 8), k.line);
      }
      return fill("M104 248 Q150 258 196 248 L" + (196 + out) + " " + hem + " Q150 " + (hem + 16) + " " + (104 - out) + " " + hem + " Z", c) +
             shade(WAIST, k.shade) + pleats;
    }
  };

  // Left shoe only; mirrored to make the pair.
  const SHOES = {
    loafers: (c, k) => fill("M115 498 L141 498 L144 510 Q146 520 134 520 L113 520 Q104 518 109 508 Z", c) +
      line("M116 507 Q128 512 142 507", k.line) + line("M109 515 L145 515", k.line),
    flats: (c, k) => fill("M114 506 Q128 502 142 506 L145 514 Q146 521 134 521 L113 521 Q104 519 109 512 Z", c) +
      line("M115 508 Q128 515 143 508", k.line),
    boots: (c, k) => fill("M114 464 L142 464 L143 500 Q148 510 147 516 Q146 521 134 521 L112 521 Q102 518 108 508 L114 498 Z", c) +
      line("M114 471 L142 471", k.line) + line("M107 515 L146 515", k.line),
    sneakers: (c, k) => fill("M113 490 L141 490 L145 506 Q149 521 134 521 L110 521 Q102 518 108 508 Z", c) +
      '<path class="garment" d="M104 515 L148 515 L148 521 Q148 523 134 523 L110 523 Q102 521 104 515 Z" fill="rgba(255,255,255,.85)"/>' +
      line("M118 497 L136 501", k.line) + line("M118 503 L138 507", k.line),
    heels: (c, k) => fill("M115 502 L141 502 L144 510 Q130 520 112 515 Z", c) +
      fill("M136 511 L141 511 L140 525 L137 525 Z", c)
  };

  // Work out the garment type from the item's name (or a type field, if the data ever has one).
  const RULES = {
    top: [["turtleneck", /turtle|mock neck|roll neck/], ["sweater", /sweater|knit|jumper|cardigan|pullover|hoodie|sweatshirt/],
          ["tank", /tank|cami|sleeveless|vest/], ["tee", /\btee\b|t-shirt|tshirt/], ["shirt", /shirt|button|polo/],
          ["blouse", /blouse|silk|satin|\btop\b|shell/]],
    bottom: [["skirt", /skirt|kilt/], ["shorts", /short/], ["jeans", /jean|denim/], ["wide", /wide|palazzo|flare|culotte/]],
    shoes: [["boots", /boot/], ["sneakers", /sneaker|trainer/], ["heels", /heel|pump|stiletto/], ["flats", /flat|ballet/]]
  };
  const DEFAULT_TYPE = { top: "tee", bottom: "trousers", shoes: "loafers" };

  function typeOf(slot, item) {
    const text = ((item.garmentType || item.type || item.subcategory || "") + " " + (item.name || "")).toLowerCase();
    const hit = RULES[slot].find((r) => r[1].test(text));
    return hit ? hit[0] : DEFAULT_TYPE[slot];
  }


  // ---------- Dresses ----------
  // One piece from shoulders to hem. Its bodice sits under the arms; sleeves are drawn after them.
  function dressShape(c, k, item, hem, out, strap) {
    const text = (item.name || "").toLowerCase();
    const top = strap
      ? "M122 116 L132 118 Q150 138 168 118 L178 116 L184 130 L198 160 L196 250"
      : "M106 122 Q128 114 140 116 Q150 130 160 116 Q172 114 194 122 L204 160 L196 250";
    const left = strap ? "L104 250 L102 160 L116 130 Z" : "L104 250 L96 160 Z";
    const d = top + " L" + (196 + out) + " " + hem + " Q150 " + (hem + 16) + " " + (104 - out) + " " + hem + " " + left;

    let pleats = "";
    const f = (46 + out) / 46;
    for (let i = 0; i < 5; i++) {
      const xw = 122 + i * 14;
      pleats += line("M" + xw + " 262 L" + (150 + (xw - 150) * f).toFixed(1) + " " + (hem + 8), k.line);
    }
    const body = fill(d, c) + shade("M104 244 Q150 254 196 244 L196 252 Q150 262 104 252 Z", k.shade) + pleats + (strap ? "" : line(NECK, k.line));

    let sleeves = "";
    if (!strap && !/sleeveless/.test(text)) {
      if (/long sleeve|full sleeve|knit|sweater/.test(text)) sleeves = fill(SLV.fit, c) + mirror(fill(SLV.fit, c)) + cuff(k);
      else sleeves = fill(SLV.short, c) + mirror(fill(SLV.short, c));
    }
    return { body: body, sleeves: sleeves };
  }
  const DRESSES = {
    midi: (c, k, it) => dressShape(c, k, it, 400, 20, false),
    maxi: (c, k, it) => dressShape(c, k, it, 478, 24, false),
    mini: (c, k, it) => dressShape(c, k, it, 346, 10, false),
    slip: (c, k, it) => dressShape(c, k, it, 410, 18, true)
  };

  // ---------- Outerwear ----------
  // Open-front panels (left drawn, right mirrored) so the top or dress underneath shows through.
  const both = (s) => s + mirror(s);
  const OUT_SLEEVE = "M108 119 Q72 127 67 160 L60 268 L96 273 L103 190 L105 150 Z";
  function outerShape(c, k, panel, extra) {
    return {
      body: both(fill(panel, c)) + (extra ? extra(k) : ""),
      sleeves: both(fill(OUT_SLEEVE, c)) + both(line("M61 260 L96 265", k.line))
    };
  }
  const lapel = (k) => both(shade("M132 112 L147 148 L140 152 L124 122 Z", k.shade) + line("M132 112 L147 148", k.line));
  const OUTER = {
    jacket: (c, k) => outerShape(c, k, "M105 120 L130 113 L147 140 L146 262 L96 262 L92 160 Z", (kk) => both(line("M147 140 L146 262", kk.line))),
    blazer: (c, k) => outerShape(c, k, "M105 120 L132 112 L147 148 L146 272 L97 272 L93 160 Z",
      (kk) => lapel(kk) + both('<circle cx="141" cy="212" r="2" fill="' + kk.line + '"/>')),
    coat: (c, k) => outerShape(c, k, "M105 120 L132 112 L147 150 L146 392 L88 392 L92 160 Z",
      (kk) => lapel(kk) + both(shade("M92 255 L146 258 L146 266 L92 263 Z", kk.shade))),
    cardigan: (c, k) => outerShape(c, k, "M105 120 Q120 114 132 116 L147 150 L146 288 Q120 296 96 288 L93 160 Z",
      (kk) => both(line("M147 150 L146 288", kk.line) + shade("M96 280 Q120 288 146 280 L146 288 Q120 296 96 288 Z", kk.shade)))
  };

  RULES.dress = [["slip", /slip|cami|strap|sleeveless/], ["maxi", /maxi|gown|full.?length|anarkali/], ["mini", /mini|short dress/]];
  RULES.outerwear = [["coat", /coat|trench|parka|overcoat|duster/], ["blazer", /blazer|suit|waistcoat/], ["cardigan", /cardigan|shrug|sweater|knit|shawl|wrap/]];
  DEFAULT_TYPE.dress = "midi";
  DEFAULT_TYPE.outerwear = "jacket";

  const layers = {
    bottom: $("layerBottom"), dress: $("layerDress"), topBody: $("layerTopBody"),
    topSleeves: $("layerTopSleeves"), outer: $("layerOuter"), shoes: $("layerShoes")
  };

  // Only touch the DOM when a layer's markup changes, so unchanged pieces don't re-animate.
  function setLayer(el, html) {
    if (!el || el._html === html) return;
    el._html = html;
    el.innerHTML = html;
  }

  // Draws whatever is in `outfit`. Any piece may be null, and accessories are not drawn.
  function renderAvatar() {
    const none = { body: "", sleeves: "" };
    let t = none, d = none, o = none, b = "", s = "";

    if (outfit.dress) {                       // a dress replaces top + bottom
      const c = colorOf(outfit.dress);
      d = DRESSES[typeOf("dress", outfit.dress)](c, ink(c), outfit.dress);
    } else {
      if (outfit.top) { const c = colorOf(outfit.top); t = TOPS[typeOf("top", outfit.top)](c, ink(c)); }
      if (outfit.bottom) { const c = colorOf(outfit.bottom); b = BOTTOMS[typeOf("bottom", outfit.bottom)](c, ink(c), outfit.bottom); }
    }
    if (outfit.outerwear) { const c = colorOf(outfit.outerwear); o = OUTER[typeOf("outerwear", outfit.outerwear)](c, ink(c)); }
    if (outfit.shoes) {
      const c = colorOf(outfit.shoes), pair = SHOES[typeOf("shoes", outfit.shoes)](c, ink(c));
      s = pair + mirror(pair);
    }
    setLayer(layers.bottom, b);
    setLayer(layers.dress, d.body);
    setLayer(layers.topBody, t.body);
    setLayer(layers.topSleeves, t.sleeves + d.sleeves);
    setLayer(layers.outer, o.body + o.sleeves);
    setLayer(layers.shoes, s);
  }

  // ---------- Rendering ----------
  function renderTabs() {
    tabsEl.innerHTML = "";
    CATEGORIES.forEach((cat) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "category-tab";
      b.id = "tab-" + cat.id;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(cat.id === activeCategory));
      b.tabIndex = cat.id === activeCategory ? 0 : -1;
      b.textContent = cat.tab;
      b.addEventListener("click", () => setCategory(cat.id));
      tabsEl.appendChild(b);
    });
  }

  function note(text, linkText, href) {
    const li = document.createElement("li");
    li.className = "list-note";
    li.textContent = text;
    if (linkText) {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = linkText;
      li.append(" ", a);
    }
    return li;
  }

  // Wardrobe items for a category, plus the selected piece if it isn't in the wardrobe list.
  function itemsFor(cat) {
    const base = catalog ? catalog[cat] || [] : [];
    const sel = outfit[cat];
    return sel && !base.some((i) => sameItem(i, sel)) ? [sel].concat(base) : base;
  }

  function renderItems() {
    listEl.setAttribute("role", "tabpanel");
    listEl.setAttribute("aria-labelledby", "tab-" + activeCategory);
    listEl.innerHTML = "";

    if (!catalog && !outfit[activeCategory]) { listEl.appendChild(note("Loading your wardrobe...")); return; }

    const items = itemsFor(activeCategory);
    if (items.length === 0) {
      listEl.appendChild(note("Nothing here yet.", "Add clothes in My Wardrobe", "wardrobe.php"));
      return;
    }

    items.forEach((item) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "item";
      btn.title = item.name;
      btn.setAttribute("aria-pressed", String(sameItem(outfit[activeCategory], item)));

      const text = document.createElement("span");
      text.className = "item-text";
      const name = document.createElement("span");
      name.className = "item-name";
      name.textContent = item.name;
      const tone = document.createElement("span");
      tone.className = "item-tone";
      tone.textContent = toneOf(item);
      text.append(name, tone);

      const check = document.createElement("span");
      check.className = "item-check";
      check.setAttribute("aria-hidden", "true");

      btn.append(makeSwatch(item), text, check);
      btn.addEventListener("click", () => toggleItem(activeCategory, item));
      li.appendChild(btn);
      listEl.appendChild(li);
    });

    if (activeCategory === "accessory") listEl.appendChild(note("Accessories are saved with your look but aren't drawn on the avatar yet."));
    if (usingSamples) listEl.appendChild(note("Showing sample pieces.", "Add your own in My Wardrobe", "wardrobe.php"));
  }

  function renderDetails() {
    detailEl.innerHTML = "";
    let count = 0;

    CATEGORIES.forEach((cat) => {
      const item = outfit[cat.id];
      if (item) count++;

      const li = document.createElement("li");
      li.className = "detail-row" + (item ? "" : " is-empty");

      const slot = document.createElement("span");
      slot.className = "detail-slot";
      slot.textContent = cat.slot + (cat.id === "accessory" ? " (not drawn)" : "");

      const value = document.createElement("span");
      value.className = "detail-value";
      const label = document.createElement("span");
      label.className = "detail-name";
      label.textContent = item ? item.name : "Not chosen yet";
      if (item) { label.title = item.name; value.append(makeSwatch(item)); }
      value.append(label);

      li.append(slot, value);

      if (item) {
        const rm = document.createElement("button");
        rm.type = "button";
        rm.className = "detail-remove";
        rm.setAttribute("aria-label", "Remove " + item.name);
        rm.textContent = "\u00D7";
        rm.addEventListener("click", () => toggleItem(cat.id, item));
        li.appendChild(rm);
      }
      detailEl.appendChild(li);
    });

    progressEl.textContent = count + (count === 1 ? " piece" : " pieces") + " chosen";
  }

  // Which body zones each category highlights while it is the active tab.
  const ZONES_FOR = { top: ["top"], bottom: ["bottom"], dress: ["top", "bottom"], outerwear: ["top"], shoes: ["shoes"], accessory: [] };

  function renderZones() {
    const covered = {
      top: !!(outfit.top || outfit.dress || outfit.outerwear),
      bottom: !!(outfit.bottom || outfit.dress),
      shoes: !!outfit.shoes
    };
    zones.forEach((z) => {
      const id = z.dataset.zone;
      z.dataset.active = String(ZONES_FOR[activeCategory].indexOf(id) !== -1);
      z.dataset.has = String(!!covered[id]);
    });
  }

  function renderAll() {
    renderTabs();
    refresh();
  }

  function refresh() {
    renderItems();
    renderDetails();
    renderZones();
    renderAvatar();
    updateSaveButton();
  }

  // ---------- Selecting ----------
  function setCategory(id) {
    activeCategory = id;
    renderAll();
  }

  function toggleItem(category, item) {
    const same = sameItem(outfit[category], item);
    outfit[category] = same ? null : item;
    noteEl.textContent = NOTE_DEFAULT;

    if (!same) {
      // a dress replaces top + bottom, and choosing a top or bottom replaces the dress
      if (category === "dress" && (outfit.top || outfit.bottom)) {
        outfit.top = null; outfit.bottom = null;
        noteEl.textContent = "Dress chosen: top and bottom cleared.";
      } else if ((category === "top" || category === "bottom") && outfit.dress) {
        outfit.dress = null;
        noteEl.textContent = "Dress removed to make room for a " + category + ".";
      } else {
        noteEl.textContent = item.name + " added to your look.";
      }
    }
    refresh();
  }

  function resetOutfit() {
    CATEGORY_IDS.forEach((id) => (outfit[id] = null));
    loadedLook = null;
    nameEl.value = "";
    noteEl.textContent = NOTE_DEFAULT;
    // also forget the look that was sent to the Studio, so a page refresh doesn't bring it back
    try { localStorage.removeItem(typeof CURRENT_KEY !== "undefined" ? CURRENT_KEY : "currentLook"); } catch (err) { /* ignore */ }
    refresh();
    showToast("Outfit reset.");
  }

  // ---------- Look from Style Matcher / My Looks ----------
  // Both pages call setCurrentLook(look, filters); we read it with getCurrentLook() and
  // split it with getLookParts(look). Missing pieces come back as null, in any order.
  function loadCurrentLook() {
    if (typeof getCurrentLook !== "function" || typeof getLookParts !== "function") return;
    try {
      const look = getCurrentLook();
      if (!look) return;
      const parts = getLookParts(look);
      CATEGORY_IDS.forEach((id) => {
        outfit[id] = parts[id] && typeof parts[id] === "object" ? parts[id] : null;
      });
      if (outfit.dress) { outfit.top = null; outfit.bottom = null; activeCategory = "dress"; }

      loadedLook = look;
      nameEl.value = look.name || "";
      noteEl.textContent = "Look loaded: " + (look.name || "your look") + ".";
      showToast("Look loaded into Style Studio.");
    } catch (err) {
      console.warn("Style Studio: couldn't read the current look.", err);
    }
  }

  // ---------- Wardrobe ----------
  function buildCatalog(items) {
    const c = {};
    CATEGORY_IDS.forEach((id) => (c[id] = []));
    items.forEach((i) => { if (i && c[i.category]) c[i.category].push(i); });
    return c;
  }

  async function loadWardrobe() {
    try {
      if (typeof adaptClothes !== "function") throw new Error("stylesphere-adapter.js is not loaded");
      const res = await fetch("fetch_clothing.php", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const items = adaptClothes(await res.json());
      if (items.length === 0) throw new Error("the wardrobe is empty");
      catalog = buildCatalog(items);
      usingSamples = false;
    } catch (err) {
      console.warn("Style Studio: showing sample pieces (" + err.message + ")");
      catalog = buildCatalog(SAMPLE_ITEMS);
      usingSamples = true;
    }
    renderItems();
  }

  // ---------- Saving (team's saved-looks.js) ----------
  // Items go in the order the engine uses, so saved looks match Style Matcher's.
  function buildLook() {
    const items = SAVE_ORDER.map((id) => outfit[id]).filter(Boolean);
    if (items.length === 0) return null;

    const look = {
      name: nameEl.value.trim() || (loadedLook && loadedLook.name) || "My custom look",
      items: items
    };
    // keep the match score only if the pieces are exactly the ones Style Matcher chose
    if (loadedLook && typeof lookKey === "function" && typeof loadedLook.score === "number" && lookKey(loadedLook) === lookKey(look)) {
      look.score = loadedLook.score;
    }
    return look;
  }

  const filtersOf = () => (loadedLook && loadedLook.filters) || {};

  function updateSaveButton() {
    let saved = false;
    try {
      const look = buildLook();
      saved = !!look && !look.items.some((i) => i.sample) && typeof isLookSaved === "function" && isLookSaved(look);
    } catch (err) { saved = false; }
    saveBtn.textContent = saved ? "Saved \u2713" : "Save look";
    saveBtn.classList.toggle("is-saved", saved);
  }

  function saveLook() {
    const look = buildLook();
    if (!look || look.items.length < 2) { showToast("Add at least two pieces to save a look."); return; }
    if (look.items.some((i) => i.sample)) { showToast("Sample pieces can't be saved. Add your own clothes in My Wardrobe first."); return; }
    if (typeof toggleSaveLook !== "function") { showToast("Saving isn't available on this page right now."); return; }

    let saved;
    try {
      saved = toggleSaveLook(look, filtersOf());   // saves, or removes it if this exact look is already saved
    } catch (err) {
      showToast("Couldn't save. Browser storage may be full or blocked.");
      return;
    }
    updateSaveButton();
    showToast("\u201C" + look.name + "\u201D " + (saved ? "saved to My Looks." : "removed from My Looks."));

    // saved-looks.js also sends the change to the database; warn if that part failed
    if (typeof whenLookSynced === "function") {
      whenLookSynced().then((r) => {
        if (r && r.ok === false) showToast("Saved on this device only. The server couldn't be reached.");
      });
    }
  }

  let toastTimer;
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }

  // ---------- Events ----------
  $("resetBtn").addEventListener("click", resetOutfit);
  saveBtn.addEventListener("click", saveLook);

  tabsEl.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = CATEGORY_IDS.indexOf(activeCategory);
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + CATEGORY_IDS.length) % CATEGORY_IDS.length;
    setCategory(CATEGORY_IDS[next]);
    $("tab-" + CATEGORY_IDS[next]).focus();
  });

  const navToggle = $("navToggle");
  const navLinks = $("navLinks");
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  window.StyleStudio = {
    // Every slot, null where empty. Pieces are the team's item objects.
    getOutfit: () => CATEGORY_IDS.reduce((acc, id) => { acc[id] = outfit[id] || null; return acc; }, {})
  };

  loadCurrentLook();
  renderAll();
  loadWardrobe();
})();
