<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>My Wardrobe | StyleSphere</title><link rel="stylesheet" href="css/style.css"></head>
<body>
<header class="site-header"><a class="brand" href="index.php">Style<span>Sphere</span></a><button class="menu-toggle" aria-label="Toggle navigation">☰</button><nav class="nav-links"><a href="index.php">Home</a><a class="active" href="wardrobe.php">My Wardrobe</a><a href="style-matcher.php">Style Matcher</a><a href="style-studio.php">Style Studio</a><a href="my-looks.php">My Looks</a></nav><a class="profile-link" href="my-looks.php">♡</a></header>
<main class="page-wrap">
  <div class="page-heading"><div><p class="eyebrow">YOUR PERSONAL COLLECTION</p><h1>My <em>wardrobe.</em></h1><p class="lead small-lead">Every piece has a place. Make the most of what you own.</p></div><button class="btn btn-dark" id="openAddForm">＋ Add clothing</button></div>
  <section class="wardrobe-stats"><div><strong id="itemCount">6</strong><span>Pieces in wardrobe</span></div><div><strong id="categoryCount">00</strong><span>Categories</span></div><div><strong>∞</strong><span>Ways to style</span></div></section>
  <section class="toolbar"><input id="searchInput" class="search-box" type="search" placeholder="⌕  Search your clothes..."><div class="filter-chips" id="filterChips"><button class="chip selected" data-filter="All">All pieces</button><button class="chip" data-filter="Tops">Tops</button><button class="chip" data-filter="Bottoms">Bottoms</button><button class="chip" data-filter="Dresses">Dresses</button><button class="chip" data-filter="Outerwear">Outerwear</button><button class="chip" data-filter="Footwear">Footwear</button><button class="chip" data-filter="Accessories">Accessories</button></div></section>
  <section id="clothingGrid" class="clothing-grid"></section>
  <p id="emptyMessage" class="empty-message" hidden>No clothing found. Try another search or add a new piece.</p>
</main>
<div class="modal-backdrop" id="addModal" hidden><section class="modal-card"><button class="modal-close" id="closeAddForm" aria-label="Close">×</button><p class="eyebrow">ADD A NEW PIECE</p><h2>Make room for <em>style.</em></h2>

<form id="clothingForm"
      action="insert_clothing.php"
      method="POST"
      enctype="multipart/form-data">

    <!-- Clothing Name -->
    <label>
        Clothing Name
        <input
            type="text"
            name="name"
            placeholder="e.g. Pink floral dress"
            required>
    </label>

    <!-- Category and Colour -->
    <div class="form-two">

        <label>
            Category
            <select name="category" required>
                <option value="">Choose category</option>
                <option value="Tops">Tops</option>
                <option value="Bottoms">Bottoms</option>
                <option value="Dresses">Dresses</option>
                <option value="Outerwear">Outerwear</option>
                <option value="Footwear">Footwear</option>
                <option value="Accessories">Accessories</option>
            </select>
        </label>

        <label>
            Colour
            <select name="color" required>
                <option value="">Choose colour</option>
                <option value="White">White</option>
                <option value="Black">Black</option>
                <option value="Grey">Grey</option>
                <option value="Beige">Beige</option>
                <option value="Cream">Cream</option>
                <option value="Blue">Blue</option>
                <option value="Brown">Brown</option>
                <option value="Olive">Olive</option>
                <option value="Pink">Pink</option>
                <option value="Burgundy">Burgundy</option>
                <option value="Red">Red</option>
                <option value="Green">Green</option>
                <option value="Yellow">Yellow</option>
                <option value="Purple">Purple</option>
                <option value="Orange">Orange</option>
            </select>
        </label>

    </div>

    <!-- Season and Occasion -->
    <div class="form-two">

        <label>
            Season
            <select name="season">
                <option value="All season">All season</option>
                <option value="Summer">Summer</option>
                <option value="Winter">Winter</option>
                <option value="Monsoon">Monsoon</option>
            </select>
        </label>

        <label>
            Occasion
            <select name="occasion">
                <option value="Everyday">Everyday</option>
                <option value="College">College</option>
                <option value="Party">Party</option>
                <option value="Formal">Formal</option>
                <option value="Festive">Festive</option>
            </select>
        </label>

    </div>

        <!-- Style (used by the Style Matcher) -->
    <label>
        Style
        <select name="style" required>
            <option value="">Choose style</option>
            <option value="casual">Casual</option>
            <option value="chic">Chic</option>
            <option value="streetwear">Streetwear</option>
            <option value="formal">Formal</option>
            <option value="minimal">Minimal</option>
            <option value="festive">Festive</option>
        </select>
    </label>

    <!-- Clothing Image -->
    <label>
        Clothing Photo
        <span class="muted">
            JPG, PNG or WebP — maximum 5 MB
        </span>

        <input
            type="file"
            name="image"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp">
    </label>

    <button class="btn btn-dark full-width" type="submit">
        Add to my wardrobe ↗
    </button>

</form>
</section></div>
<div class="toast" id="toast"></div>
<footer class="site-footer"><a class="brand" href="index.php">Style<span>Sphere</span></a><p>Made for the love of getting dressed.</p><span>© <?php echo date("Y"); ?> StyleSphere</span></footer>
<script src="js/app.js"></script></body></html>