// ============================================
// StyleSphere · Recommendation Engine
// A rule-based scoring algorithm (no AI).
//
//   Occasion match        up to 30
//   Weather match         up to 30
//   Style match           up to 20
//   -----------------------------------
//   Item score            up to 80  (averaged over the CORE pieces only)
//   Color compatibility   up to 10  (all pieces, extras included)
//   Complete outfit       10
//   Extras bonus          up to 5 per extra (outerwear, accessory), added on top
//   -----------------------------------
//   Outfit score          capped at 100  → shown as "% match"
//
// Outfit templates (the CORE pieces):
//   standard   top + bottom + shoes
//   dress      dress + shoes
//
// Optional EXTRAS, added to either template only when they raise the score:
//   outerwear  only when the weather is cold or rainy  (standard + outerwear = "layered")
//   accessory  any weather                             (any outfit + accessory = "complete")
// ============================================

const POINTS = { occasion: 30, weather: 30, style: 20, color: 10, complete: 10 };

// Outfits scoring below this are treated as "not a real match" and are never shown.
// Raise it for stricter results, lower it to see more suggestions.
const MIN_MATCH_SCORE = 50;

// "All season" items fit any weather, but a piece made for exactly this weather should still win.
const ANY_WEATHER_FACTOR = 0.8;   // all-season item earns 80% of the weather points
// Items with no style tag (the database has no style column yet) get a neutral share of the style points.
const NO_STYLE_FACTOR = 0.5;

// ---------- Extras: outerwear + accessories ----------
// An item's score can reach at most this much (occasion + weather + style).
const MAX_ITEM_SCORE = POINTS.occasion + POINTS.weather + POINTS.style;   // 80

// Bonus points an extra can add. The bonus is scaled by how well the extra matches
// (a perfect match earns the full bonus, a half match earns half).
const EXTRA_BONUS = { outerwear: 5, accessory: 5 };

// An extra must score at least half of the maximum item score to be considered at all.
const MIN_EXTRA_ITEM_SCORE = MAX_ITEM_SCORE / 2;   // 40

// Outerwear is only added when the weather calls for a layer.
const LAYER_WEATHERS = ["cold", "rainy"];

// Near-matches earn half points, so a "casual" item can still
// work for "college" even if it isn't tagged exactly that.
const RELATED = {
    occasion: {
        college: ["casual"],
        casual:  ["college"],
        party:   ["festive", "formal"],
        festive: ["party"],
        formal:  ["party"]
    },
    weather: {
        pleasant: ["hot", "cold"],
        hot:      ["pleasant"],
        cold:     ["pleasant", "rainy"],
        rainy:    ["cold"]
    },
    // wanted style → item styles that still earn half points
    style: {
        minimal:    ["chic", "casual"],
        chic:       ["minimal", "formal"],
        streetwear: ["casual"],
        casual:     ["minimal", "streetwear"],
        formal:     ["chic", "minimal"],
        festive:    ["chic", "formal"]
    }
};

// Neutral colors go with everything.
const NEUTRALS = ["white", "black", "grey", "beige", "cream", "blue", "brown", "olive"];

// Used by the UI to paint a swatch when an item's image is missing.
// These are also the colours offered in the wardrobe form (keep in sync with insert_clothing.php).
const COLOR_HEX = {
    white: "#f4f1ec", black: "#25201f", grey: "#9a9593", beige: "#d8c3a5",
    cream: "#efe3cf", blue: "#5b7aa3", brown: "#7a5841", olive: "#7d7a4f",
    pink: "#e8aab8", burgundy: "#6b2737", red: "#b03a3a", green: "#5f8466",
    yellow: "#e6c65a", purple: "#8a6aa8", orange: "#d98a4a"
};

// Three names per occasion, one for each of the 3 looks.
const LOOK_NAMES = {
    college: ["The Campus Edit",  "The Library Look",   "The Quad Classic"],
    casual:  ["The Everyday Edit","The Weekend Walk",   "The Easy Day"],
    party:   ["The Night Out",    "The Glow Edit",      "The After Dark"],
    formal:  ["The Polished Edit","The Boardroom Look", "The Refined Classic"],
    festive: ["The Festive Edit", "The Celebration",    "The Glow Up"]
};

// ---------- 1. Score a single item ----------
function matchPoints(value, wanted, relatedMap, full) {
    if (value === wanted) return full;
    if ((relatedMap[wanted] || []).includes(value)) return full / 2;
    return 0;
}

function scoreItem(item, filters) {
    const occasion = matchPoints(item.occasion, filters.occasion, RELATED.occasion, POINTS.occasion);
    const weather  = item.weather === "any"
        ? POINTS.weather * ANY_WEATHER_FACTOR
        : matchPoints(item.weather, filters.weather, RELATED.weather, POINTS.weather);
    const style    = !item.style
        ? POINTS.style * NO_STYLE_FACTOR
        : matchPoints(item.style, filters.style, RELATED.style, POINTS.style);
    return { occasion, weather, style, total: occasion + weather + style };
}

// ---------- 2. Color compatibility of a whole outfit ----------
function colorScore(items) {
    const loud = items
        .map(i => i.color)
        .filter(c => c && !NEUTRALS.includes(c));   // an item with no colour is not an accent
    const loudColors = [...new Set(loud)];

    if (loudColors.length <= 1) return POINTS.color;       // neutrals + at most one accent
    if (loudColors.length === 2) return POINTS.color / 2;  // two accents: risky
    return 0;                                              // too many colors
}

// ---------- 3. Score a whole outfit ----------
// coreItems = the required pieces of the template (top + bottom + shoes, or dress + shoes).
// extras    = optional outerwear / accessory. They are NOT averaged with the core
//             (that would dilute the score); they add a small bonus instead.
// With no extras this is exactly the original top + bottom + shoes formula.
function extraBonus(item, filters) {
    const share = scoreItem(item, filters).total / MAX_ITEM_SCORE;   // 0 … 1
    return EXTRA_BONUS[item.category] * share;
}

function scoreOutfit(coreItems, filters, extras = []) {
    const itemScores = coreItems.map(i => scoreItem(i, filters));
    const avg = itemScores.reduce((sum, s) => sum + s.total, 0) / coreItems.length; // max 80
    const color = colorScore([...coreItems, ...extras]);
    const complete = POINTS.complete; // every template is built with all of its core pieces
    const bonus = extras.reduce((sum, e) => sum + extraBonus(e, filters), 0);

    const raw = avg + color + complete + bonus;   // uncapped, used to compare candidates
    return {
        score: Math.min(Math.round(raw), 100),
        raw,
        breakdown: { itemAverage: avg, color, complete, extras: bonus }
    };
}

// ---------- 4. Optional extras ----------
// Can this outerwear / accessory be considered for this request at all?
function extraFits(item, filters) {
    const s = scoreItem(item, filters);
    if (s.total < MIN_EXTRA_ITEM_SCORE) return false;
    if (item.category === "outerwear") {
        if (!LAYER_WEATHERS.includes(filters.weather)) return false;  // no jacket on a hot/pleasant day
        if (s.weather === 0) return false;                            // and it must suit the weather
    }
    return true;
}

// Takes a core outfit and tries to add the best outerwear, then the best accessory.
// An extra is added ONLY if it raises the outfit's score (so a clashing one is never forced in).
function buildOutfit(core, pools, filters) {
    const chosen = [];
    let best = scoreOutfit(core.items, filters, chosen);

    ["outerwear", "accessory"].forEach(function (category) {
        let pick = null;
        let pickScore = best;
        (pools[category] || []).forEach(function (item) {
            if (!extraFits(item, filters)) return;
            const trial = scoreOutfit(core.items, filters, [...chosen, item]);
            if (trial.raw > pickScore.raw) { pick = item; pickScore = trial; }
        });
        if (pick) { chosen.push(pick); best = pickScore; }
    });

    const outerwear = chosen.find(i => i.category === "outerwear");
    const accessory = chosen.find(i => i.category === "accessory");

    // display order: main pieces, outerwear, shoes (always last core piece), accessory
    const shoes = core.items[core.items.length - 1];
    const main = core.items.slice(0, -1);
    const items = [...main, ...(outerwear ? [outerwear] : []), shoes, ...(accessory ? [accessory] : [])];

    // label: a dress outfit stays "dress"; top + bottom becomes "layered" if outerwear was added
    const type = core.type === "standard" && outerwear ? "layered" : core.type;

    return {
        items,
        score: best.score,
        breakdown: best.breakdown,
        type,
        hasAccessory: !!accessory,
        keys: core.keys
    };
}

// ---------- 5. Build every outfit, then pick the best 3 ----------
function generateOutfits(allClothes, filters, howMany = 3) {
    const byCategory = cat => allClothes.filter(c => c.category === cat);
    const tops      = byCategory("top");
    const bottoms   = byCategory("bottom");
    const shoes     = byCategory("shoes");
    const dresses   = byCategory("dress");
    const pools     = { outerwear: byCategory("outerwear"), accessory: byCategory("accessory") };

    // Core outfits for each template. keys = the two pieces used to keep the 3 looks different from each other.
    const cores = [];

    // template 1: standard = top + bottom + shoes
    if (tops.length && bottoms.length && shoes.length) {
        tops.forEach(top => {
            bottoms.forEach(bottom => {
                shoes.forEach(shoe => {
                    cores.push({ type: "standard", items: [top, bottom, shoe], keys: [top.id, bottom.id] });
                });
            });
        });
    }

    // template 2: dress = dress + shoes
    if (dresses.length && shoes.length) {
        dresses.forEach(dress => {
            shoes.forEach(shoe => {
                cores.push({ type: "dress", items: [dress, shoe], keys: [dress.id, shoe.id] });
            });
        });
    }

    if (!cores.length) return [];

    // add the best optional outerwear / accessory to each, then score
    let all = cores.map(core => buildOutfit(core, pools, filters));

    // best first
    all.sort((a, b) => b.score - a.score);

    // drop weak matches (may leave fewer than 3 looks, or none)
    all = all.filter(o => o.score >= MIN_MATCH_SCORE);

    // Pick looks that feel different from each other:
    // 1st pass → different main piece (top, or dress), 2nd pass → different second piece (bottom, or shoes
    // for a dress), 3rd pass → anything. (Item ids are unique, so the two kinds never clash.)
    const picked = [];
    const usedFirst = new Set();
    const usedSecond = new Set();

    all.forEach(o => {
        if (picked.length < howMany && !usedFirst.has(o.keys[0])) {
            picked.push(o);
            usedFirst.add(o.keys[0]);
            usedSecond.add(o.keys[1]);
        }
    });
    all.forEach(o => {
        if (picked.length < howMany && !picked.includes(o) && !usedSecond.has(o.keys[1])) {
            picked.push(o);
            usedSecond.add(o.keys[1]);
        }
    });
    all.forEach(o => {
        if (picked.length < howMany && !picked.includes(o)) picked.push(o);
    });

    picked.sort((a, b) => b.score - a.score);

    const names = LOOK_NAMES[filters.occasion] || ["The Look", "The Look II", "The Look III"];
    return picked.map((o, i) => ({
        name: names[i] || "The Look",
        items: o.items,
        score: o.score,
        breakdown: o.breakdown,
        type: o.type,                  // "standard" | "dress" | "layered"
        hasAccessory: o.hasAccessory   // true = a "complete" outfit
    }));
}