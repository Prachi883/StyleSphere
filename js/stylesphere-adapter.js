// ============================================
// StyleSphere · Adapter
// Converts rows from fetch_clothing.php into the shape the recommendation
// engine expects, plus two small helpers for safely drawing cards.
//
//   DB row:  id, name, category, color, season, occasion, style, image_path
//   Engine:  id, name, category, color, style, occasion, weather, image
//
// Load AFTER recommendation-engine.js (uses COLOR_HEX) and before the page script.
// Every name starts with "ss" so nothing collides with app.js.
// ============================================

const SS_CATEGORY_MAP = {
    tops: "top", top: "top",
    bottoms: "bottom", bottom: "bottom",
    footwear: "shoes", shoes: "shoes",
    // Added for the outfit extension. The engine does not use these yet (Step 2),
    // so Top + Bottom + Shoes recommendations are unchanged.
    dresses: "dress", dress: "dress",
    outerwear: "outerwear",
    accessories: "accessory", accessory: "accessory"
};

const SS_OCCASION_MAP = {
    everyday: "casual", casual: "casual",
    college: "college", party: "party", formal: "formal", festive: "festive"
};

// "any" = the item works in every weather (see ANY_WEATHER_FACTOR in the engine)
const SS_SEASON_MAP = {
    summer: "hot", winter: "cold", monsoon: "rainy",
    "all season": "any", "all-season": "any", "": "any"
};

// Free-text colours from the wardrobe form → colours the engine knows
const SS_COLOR_ALIASES = {
    ivory: "cream", "off white": "cream", "off-white": "cream", offwhite: "cream",
    rose: "pink", "light pink": "pink", "baby pink": "pink", blush: "pink",
    navy: "blue", "navy blue": "blue", "light blue": "blue", "dark blue": "blue", denim: "blue", teal: "blue",
    gray: "grey", charcoal: "grey", silver: "grey",
    tan: "beige", khaki: "beige", nude: "beige", camel: "beige", sand: "beige",
    maroon: "burgundy", wine: "burgundy",
    "olive green": "olive", "dark green": "green", "light green": "green",
    violet: "purple", lavender: "purple"
};

// The six style values the database (and the Style Matcher chips) use.
const SS_STYLES = ["casual", "chic", "streetwear", "formal", "minimal", "festive"];

function ssNormalize(value) {
    return String(value == null ? "" : value).trim().toLowerCase();
}

// Escape text before putting it inside innerHTML
function ssEscape(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch];
    });
}

// Inline style for a look tile: colour swatch always, photo only if there is one
function ssTileStyle(item) {
    const hex = (typeof COLOR_HEX !== "undefined" && COLOR_HEX[item.color]) || "#e5d8c8";
    let css = "background-color:" + hex + ";";
    if (item.image) {
        css += "background-image:url('" + encodeURI(item.image).replace(/'/g, "%27") + "');";
    }
    return css;
}

// Convert database rows → engine items. Rows the engine can't use are skipped.
function adaptClothes(rows) {
    if (!Array.isArray(rows)) return [];

    return rows.map(function (row) {
        const category = SS_CATEGORY_MAP[ssNormalize(row.category)];
        if (!category) return null;

        const colorRaw = ssNormalize(row.color);
        const season = ssNormalize(row.season);

        return {
            id: Number(row.id),
            name: String(row.name || "Untitled piece"),
            category: category,
            color: SS_COLOR_ALIASES[colorRaw] || colorRaw,          // "" if none given
            style: SS_STYLES.includes(ssNormalize(row.style)) ? ssNormalize(row.style) : "",   // "" = untagged (old rows)
            occasion: SS_OCCASION_MAP[ssNormalize(row.occasion)] || "casual",
            weather: SS_SEASON_MAP[season] || "any",
            image: row.image_path || row.image || ""                 // "" if no photo was uploaded
        };
    }).filter(Boolean);
}