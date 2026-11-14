<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Style Matcher | StyleSphere</title>
<link rel="stylesheet" href="css/style.css">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Jost:wght@300;400;500&family=Pinyon+Script&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style-matcher.css"></head>
<body>
<header class="site-header"><a class="brand" href="index.php">Style<span>Sphere</span></a><button class="menu-toggle" aria-label="Toggle navigation">☰</button><nav class="nav-links"><a href="index.php">Home</a><a href="wardrobe.php">My Wardrobe</a><a class="active" href="style-matcher.php">Style Matcher</a><a href="style-studio.php">Style Studio</a><a href="my-looks.php">My Looks</a></nav><a class="profile-link" href="my-looks.php">♡</a></header>
<main class="sm-page">
        <!-- HERO / SELECTOR -->
        <section class="sm-matcher">

            <!-- Left collage -->
            <div class="collage" aria-hidden="true">
                <div class="sm-polaroid sm-polaroid-main">
                    <div class="photo photo-wardrobe"></div>
                    <span class="tape"></span>
                </div>
                <div class="sm-polaroid sm-polaroid-small">
                    <div class="photo photo-coffee"></div>
                </div>
                <p class="script-note">find<br>your<br>fit ♡</p>
            </div>

            <!-- Right: form -->
            <div class="sm-content">
                <p class="sm-eyebrow">STYLE MATCHER</p>
                <h1>What are you<br>dressing for <em>today?</em></h1>
                <p class="sm-lead">Tell us a bit about your plan, the weather, and your style mood — we'll find the perfect look from your wardrobe.</p>

                <!-- hidden inputs keep the values your JS reads -->
                <input type="hidden" id="occasion" value="college">
                <input type="hidden" id="weather" value="pleasant">
                <input type="hidden" id="style" value="chic">

                <div class="option-row" data-target="occasion">
                    <div class="option-label">
                        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>
                        <div>
                            <h3>Occasion</h3>
                            <p>Where are you heading?</p>
                        </div>
                    </div>
                    <div class="sm-chips">
                        <button type="button" class="sm-chip active" data-value="college">College</button>
                        <button type="button" class="sm-chip" data-value="casual">Casual</button>
                        <button type="button" class="sm-chip" data-value="party">Party</button>
                        <button type="button" class="sm-chip" data-value="formal">Formal</button>
                        <button type="button" class="sm-chip" data-value="festive">Festive</button>
                    </div>
                </div>

                <div class="option-row" data-target="weather">
                    <div class="option-label">
                        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/></svg>
                        <div>
                            <h3>Weather</h3>
                            <p>How does it feel outside?</p>
                        </div>
                    </div>
                    <div class="sm-chips">
                        <button type="button" class="sm-chip" data-value="hot">Hot</button>
                        <button type="button" class="sm-chip active" data-value="pleasant">Pleasant</button>
                        <button type="button" class="sm-chip" data-value="cold">Cold</button>
                        <button type="button" class="sm-chip" data-value="rainy">Rainy</button>
                    </div>
                </div>

                <div class="option-row" data-target="style">
                    <div class="option-label">
                        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5a2.2 2.2 0 1 0-2.2-2.2"/><path d="M12 6.5v2.2L21 15.5a1.2 1.2 0 0 1-.7 2.2H3.7A1.2 1.2 0 0 1 3 15.5l9-6.8"/></svg>
                        <div>
                            <h3>Style</h3>
                            <p>What's your mood today?</p>
                        </div>
                    </div>
                    <div class="sm-chips">
                        <button type="button" class="sm-chip" data-value="minimal">Minimal</button>
                        <button type="button" class="sm-chip active" data-value="chic">Chic</button>
                        <button type="button" class="sm-chip" data-value="streetwear">Streetwear</button>
                        <button type="button" class="sm-chip" data-value="casual">Casual</button>
                        <button type="button" class="sm-chip" data-value="formal">Formal</button>
                        <button type="button" class="sm-chip" data-value="festive">Festive</button>
                    </div>
                </div>

                <div class="cta-wrap">
                    <button type="button" id="findOutfitBtn" class="cta">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>
                        Find My Outfit
                        <span class="arrow">→</span>
                    </button>
                </div>
            </div>
        </section>

        <!-- RESULTS -->
        <section class="results" id="results" hidden>
            <p class="sm-eyebrow center">YOUR MATCHES</p>
            <h2 id="resultsTitle">Three looks, picked for you</h2>
            <div class="cards" id="cardsContainer"></div>
        </section>
    </main>
<footer class="site-footer"><a class="brand" href="index.php">Style<span>Sphere</span></a><p>Made for the love of getting dressed.</p><span>© <?php echo date("Y"); ?> StyleSphere</span></footer>
<script src="js/app.js"></script><script src="js/recommendation-engine.js"></script><script src="js/stylesphere-adapter.js"></script><script src="js/saved-looks.js"></script><script src="js/style-matcher.js"></script></body></html>