<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Style Studio | StyleSphere</title>
  <meta name="description" content="Build and preview outfits piece by piece in StyleSphere's Style Studio.">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">

  <!-- Studio-only stylesheet. Self-contained so it never clashes with style.css -->
  <link rel="stylesheet" href="css/style-studio.css">
</head>
<body>

  <header class="studio-nav">
    <a class="studio-brand" href="index.php">StyleSphere</a>

    <button class="studio-nav-toggle" id="navToggle" aria-expanded="false" aria-controls="navLinks" aria-label="Toggle menu">
      <span></span><span></span>
    </button>

    <nav class="studio-nav-links" id="navLinks" aria-label="Main">
      <a href="index.php">Home</a>
      <a href="wardrobe.php">My Wardrobe</a>
      <a href="style-matcher.php">Style Matcher</a>
      <a href="style-studio.php" aria-current="page">Style Studio</a>
      <a href="my-looks.php">My Looks</a>
    </nav>
  </header>

  <main class="studio">
    <section class="studio-intro">
      <h1>Style Studio</h1>
      <p>Pick a top and bottom (or a dress), add outerwear and shoes, and watch your look come together. The preview is a stylized illustration drawn in your item colours.</p>
    </section>

    <div class="studio-grid">

      <!-- Left: clothing selection -->
      <aside class="panel wardrobe-panel" aria-labelledby="wardrobeTitle">
        <h2 id="wardrobeTitle">Wardrobe</h2>
        <div class="category-tabs" id="categoryTabs" role="tablist" aria-label="Clothing categories"></div>
        <ul class="item-list" id="itemList" aria-live="polite"></ul>
      </aside>

      <!-- Centre: avatar workspace -->
      <section class="stage" aria-label="Avatar workspace">
        <div class="stage-arch">
          <svg class="avatar" id="avatar" viewBox="0 0 300 560" role="img" aria-label="Mannequin wearing the selected outfit">
            <ellipse class="floor" cx="150" cy="526" rx="86" ry="10"/>
            <g class="base">
              <ellipse cx="150" cy="62" rx="26" ry="32"/>
              <rect x="142" y="90" width="16" height="30" rx="6"/>
              <path d="M104 126 Q80 134 76 180 L70 270 Q69 282 79 282 Q88 282 90 270 L102 190 Z"/>
              <path d="M196 126 Q220 134 224 180 L230 270 Q231 282 221 282 Q212 282 210 270 L198 190 Z"/>
              <path d="M104 124 Q150 110 196 124 L202 160 L194 252 Q150 262 106 252 L98 160 Z"/>
              <path d="M106 252 Q150 262 194 252 L200 300 L184 500 L158 500 L150 330 L142 500 L116 500 L100 300 Z"/>
            </g>
            <!-- Garment layers (filled by js/style-studio.js). Order: bottom, dress, top body, arms, sleeves, outerwear, shoes -->
            <g class="layer" id="layerBottom"></g>
            <g class="layer" id="layerDress"></g>
            <g class="layer" id="layerTopBody"></g>
            <g class="layer arms">
              <path d="M104 126 Q80 134 76 180 L70 270 Q69 282 79 282 Q88 282 90 270 L102 190 Z"/>
              <path d="M196 126 Q220 134 224 180 L230 270 Q231 282 221 282 Q212 282 210 270 L198 190 Z"/>
            </g>
            <g class="layer" id="layerTopSleeves"></g>
            <g class="layer" id="layerOuter"></g>
            <g class="layer" id="layerShoes"></g>
            <g class="zone" data-zone="top"><path d="M104 124 Q150 110 196 124 L202 160 L194 252 Q150 262 106 252 L98 160 Z"/></g>
            <g class="zone" data-zone="bottom"><path d="M106 252 Q150 262 194 252 L200 300 L184 490 L158 490 L150 330 L142 490 L116 490 L100 300 Z"/></g>
            <g class="zone" data-zone="shoes"><ellipse cx="128" cy="504" rx="24" ry="10"/><ellipse cx="172" cy="504" rx="24" ry="10"/></g>
          </svg>
        </div>
        <p class="stage-note" id="stageNote">A stylized preview. Garments are illustrations in your item colours.</p>

        <div class="stage-actions">
          <button class="btn btn-ghost" id="resetBtn" type="button">Reset outfit</button>
          <button class="btn btn-solid" id="saveBtn" type="button">Save look</button>
        </div>
      </section>

      <!-- Right: outfit details -->
      <aside class="panel details-panel" aria-labelledby="detailsTitle">
        <h2 id="detailsTitle">Outfit details</h2>
        <p class="progress" id="progress">0 pieces chosen</p>
        <ul class="detail-list" id="detailList"></ul>

        <label class="look-name" for="lookName">Look name</label>
        <input id="lookName" type="text" maxlength="40" placeholder="Sunday brunch">
      </aside>

    </div>
  </main>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <!-- Team scripts first: engine (COLOR_HEX), adapter (adaptClothes), shared look storage -->
  <script src="js/recommendation-engine.js"></script>
  <script src="js/stylesphere-adapter.js"></script>
  <script src="js/saved-looks.js"></script>
  <script src="js/style-studio.js"></script>
</body>
</html>