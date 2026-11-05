// ============================================
// TEMPORARY clothes data
// Replace later with the real data from Riyanshi's get_clothes.php.
// Every item uses the same fields the database will return:
// id, name, image, category, color, style, occasion, weather
// category must be: "top", "bottom" or "shoes"
// ============================================

const clothes = [
    // ---------- TOPS ----------
    { id: 1,  name: "White Shirt",          category: "top",    color: "white",    style: "minimal",    occasion: "college", weather: "pleasant", image: "images/white-shirt.jpg" },
    { id: 2,  name: "Beige Knit Sweater",   category: "top",    color: "beige",    style: "chic",       occasion: "college", weather: "cold",     image: "images/beige-sweater.jpg" },
    { id: 3,  name: "Black Fitted Tee",     category: "top",    color: "black",    style: "chic",       occasion: "casual",  weather: "pleasant", image: "images/black-tee.jpg" },
    { id: 4,  name: "Pink Cardigan",        category: "top",    color: "pink",     style: "feminine",   occasion: "college", weather: "pleasant", image: "images/pink-cardigan.jpg" },
    { id: 5,  name: "Oversized Graphic Tee",category: "top",    color: "grey",     style: "streetwear", occasion: "casual",  weather: "hot",      image: "images/graphic-tee.jpg" },
    { id: 6,  name: "Satin Camisole",       category: "top",    color: "burgundy", style: "chic",       occasion: "party",   weather: "pleasant", image: "images/satin-camisole.jpg" },
    { id: 7,  name: "Cream Blouse",         category: "top",    color: "cream",    style: "chic",       occasion: "college", weather: "pleasant", image: "images/cream-blouse.jpg" },
    { id: 8,  name: "Pink Baby Tee",        category: "top",    color: "pink",     style: "y2k",        occasion: "casual",  weather: "hot",      image: "images/baby-tee.jpg" },

    // ---------- BOTTOMS ----------
    { id: 9,  name: "Blue Jeans",           category: "bottom", color: "blue",     style: "casual",     occasion: "college", weather: "pleasant", image: "images/blue-jeans.jpg" },
    { id: 10, name: "Straight Jeans",       category: "bottom", color: "blue",     style: "chic",       occasion: "college", weather: "pleasant", image: "images/straight-jeans.jpg" },
    { id: 11, name: "Black Trousers",       category: "bottom", color: "black",    style: "chic",       occasion: "formal",  weather: "pleasant", image: "images/black-trousers.jpg" },
    { id: 12, name: "Cargo Pants",          category: "bottom", color: "olive",    style: "streetwear", occasion: "casual",  weather: "pleasant", image: "images/cargo-pants.jpg" },
    { id: 13, name: "Pleated Skirt",        category: "bottom", color: "beige",    style: "feminine",   occasion: "college", weather: "pleasant", image: "images/pleated-skirt.jpg" },
    { id: 14, name: "Denim Shorts",         category: "bottom", color: "blue",     style: "casual",     occasion: "casual",  weather: "hot",      image: "images/denim-shorts.jpg" },
    { id: 15, name: "Low-Rise Jeans",       category: "bottom", color: "blue",     style: "y2k",        occasion: "party",   weather: "pleasant", image: "images/lowrise-jeans.jpg" },

    // ---------- SHOES ----------
    { id: 16, name: "White Sneakers",       category: "shoes",  color: "white",    style: "casual",     occasion: "college", weather: "pleasant", image: "images/white-sneakers.jpg" },
    { id: 17, name: "Black Boots",          category: "shoes",  color: "black",    style: "chic",       occasion: "college", weather: "cold",     image: "images/black-boots.jpg" },
    { id: 18, name: "Brown Loafers",        category: "shoes",  color: "brown",    style: "chic",       occasion: "formal",  weather: "pleasant", image: "images/brown-loafers.jpg" },
    { id: 19, name: "Chunky Sneakers",      category: "shoes",  color: "white",    style: "streetwear", occasion: "casual",  weather: "pleasant", image: "images/chunky-sneakers.jpg" },
    { id: 20, name: "Strappy Heels",        category: "shoes",  color: "black",    style: "chic",       occasion: "party",   weather: "pleasant", image: "images/strappy-heels.jpg" }
];