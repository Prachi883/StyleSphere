// ============================================
// StyleSphere · Recommendation Engine
// A rule-based scoring algorithm (no AI).
//
//   Occasion match        up to 30
//   Weather match         up to 30
//   Style match           up to 20
//   -----------------------------------
//   Item score            up to 80  (averaged over top, bottom, shoes)
//   Color compatibility   up to 10
//   Complete outfit       10
//   -----------------------------------
//   Outfit score          up to 100  → shown as "% match"
// ============================================

const POINTS = { occasion: 30, weather: 30, style: 20, color: 10, complete: 10 };

// Outfits scoring below this are treated as "not a real match" and are never shown.
// Raise it for stricter results, lower it to see more suggestions.
const MIN_MATCH_SCORE = 50;

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
    style: {
        minimal:    ["chic", "casual"],
        chic:       ["minimal", "feminine"],
        feminine:   ["chic"],
        streetwear: ["y2k", "casual"],
        y2k:        ["streetwear"],
        casual:     ["minimal", "streetwear"]
    }
};

// Neutral colors go with everything.
const NEUTRALS = ["white", "black", "grey", "beige", "cream", "blue", "brown", "olive"];

// Used by the UI to paint a swatch when an item's image is missing.
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
    const weather  = matchPoints(item.weather,  filters.weather,  RELATED.weather,  POINTS.weather);
    const style    = matchPoints(item.style,    filters.style,    RELATED.style,    POINTS.style);
    return { occasion, weather, style, total: occasion + weather + style };
}

// ---------- 2. Color compatibility of a whole outfit ----------
function colorScore(items) {
    const loud = items
        .map(i => i.color)
        .filter(c => !NEUTRALS.includes(c));
    const loudColors = [...new Set(loud)];

    if (loudColors.length <= 1) return POINTS.color;       // neutrals + at most one accent
    if (loudColors.length === 2) return POINTS.color / 2;  // two accents: risky
    return 0;                                              // too many colors
}

// ---------- 3. Score a whole outfit ----------
function scoreOutfit(items, filters) {
    const itemScores = items.map(i => scoreItem(i, filters));
    const avg = itemScores.reduce((sum, s) => sum + s.total, 0) / items.length; // max 80
    const color = colorScore(items);
    const complete = POINTS.complete; // only full top+bottom+shoes outfits are built
    const score = Math.round(avg + color + complete);

    return { score: Math.min(score, 100), breakdown: { itemAverage: avg, color, complete } };
}

// ---------- 4. Build every outfit, then pick the best 3 ----------
function generateOutfits(allClothes, filters, howMany = 3) {
    const tops    = allClothes.filter(c => c.category === "top");
    const bottoms = allClothes.filter(c => c.category === "bottom");
    const shoes   = allClothes.filter(c => c.category === "shoes");

    if (!tops.length || !bottoms.length || !shoes.length) return [];

    let all = [];
    tops.forEach(top => {
        bottoms.forEach(bottom => {
            shoes.forEach(shoe => {
                const items = [top, bottom, shoe];
                const { score, breakdown } = scoreOutfit(items, filters);
                all.push({ items, score, breakdown });
            });
        });
    });

    // best first
    all.sort((a, b) => b.score - a.score);

    // drop weak matches (may leave fewer than 3 looks, or none)
    all = all.filter(o => o.score >= MIN_MATCH_SCORE);

    // Pick looks that feel different from each other:
    // 1st pass → different top, 2nd pass → different bottom, 3rd pass → anything.
    const picked = [];
    const usedTops = new Set();
    const usedBottoms = new Set();

    all.forEach(o => {
        if (picked.length < howMany && !usedTops.has(o.items[0].id)) {
            picked.push(o);
            usedTops.add(o.items[0].id);
            usedBottoms.add(o.items[1].id);
        }
    });
    all.forEach(o => {
        if (picked.length < howMany && !picked.includes(o) && !usedBottoms.has(o.items[1].id)) {
            picked.push(o);
            usedBottoms.add(o.items[1].id);
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
        breakdown: o.breakdown
    }));
}