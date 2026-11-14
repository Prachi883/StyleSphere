<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>My Looks | StyleSphere</title>
<link rel="stylesheet" href="css/style.css">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Jost:wght@300;400;500&family=Pinyon+Script&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style-matcher.css"></head>
<body>
<header class="site-header"><a class="brand" href="index.php">Style<span>Sphere</span></a><button class="menu-toggle" aria-label="Toggle navigation">☰</button><nav class="nav-links"><a href="index.php">Home</a><a href="wardrobe.php">My Wardrobe</a><a href="style-matcher.php">Style Matcher</a><a href="style-studio.php">Style Studio</a><a class="active" href="my-looks.php">My Looks</a></nav><a class="profile-link" href="my-looks.php">♡</a></header>
<main class="sm-page looks-page">

        <!-- HEADER -->
        <section class="looks-header">
            <p class="sm-eyebrow center">MY LOOKS</p>
            <h1>Your saved <em>looks</em></h1>
            <p class="sm-lead center" id="looksSubtitle">Every outfit you love, kept in one place.</p>

            <div class="sm-chips sm-filter-chips" id="looksFilterChips"></div>
        </section>

        <!-- SAVED LOOKS -->
        <section class="looks-grid-section">
            <div class="cards saved-cards" id="savedCards"></div>

            <!-- shown when nothing is saved -->
            <div class="empty-state" id="emptyState" hidden>
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M6 3h12v18l-6-4.5L6 21z"/></svg>
                </div>
                <p class="script-heading">nothing here yet</p>
                <p class="empty-text">Find an outfit you love in the Style Matcher and tap <strong>Save Look</strong> — it will appear here.</p>
                <a href="style-matcher.php" class="cta cta-link">Find My Outfit <span class="arrow">→</span></a>
            </div>

            <div class="clear-wrap" id="clearWrap" hidden>
                <button type="button" class="text-btn" id="clearAllBtn">Clear all saved looks</button>
            </div>
        </section>
    </main>
<footer class="site-footer"><a class="brand" href="index.php">Style<span>Sphere</span></a><p>Made for the love of getting dressed.</p><span>© <?php echo date("Y"); ?> StyleSphere</span></footer>
<script src="js/app.js"></script><script src="js/recommendation-engine.js"></script><script src="js/stylesphere-adapter.js"></script><script src="js/saved-looks.js"></script><script src="js/my-looks.js"></script></body></html>