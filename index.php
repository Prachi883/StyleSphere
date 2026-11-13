<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StyleSphere | Your Digital Wardrobe</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
<header class="site-header">
  <a class="brand" href="index.php">Style<span>Sphere</span></a>
  <button class="menu-toggle" aria-label="Toggle navigation">☰</button>
  <nav class="nav-links">
    <a class="active" href="index.php">Home</a><a href="wardrobe.php">My Wardrobe</a>
    <a href="style-matcher.php">Style Matcher</a><a href="style-studio.php">Style Studio</a><a href="my-looks.php">My Looks</a>
  </nav>
  <a class="profile-link" href="wardrobe.php" aria-label="My wardrobe">♡</a>
</header>
<main>
  <section class="home-hero">
    <div class="hero-copy">
      <p class="eyebrow">YOUR STYLE. YOUR SPACE. YOUR SPHERE.</p>
      <h1>Wear what<br>feels <em>like you.</em></h1>
      <p class="lead">A little more joy in getting dressed. Organise your clothes, discover fresh combinations and make every outfit your own.</p>
      <div class="button-row"><a class="btn btn-dark" href="wardrobe.php">Explore my wardrobe <span>↗</span></a><a class="btn btn-light" href="style-matcher.php">Find an outfit</a></div>
      <div class="hero-note"><span class="note-dot"></span> A wardrobe that works with you, not against you.</div>
    </div>
    <div class="hero-art">
      <div class="art-label">THE EVERYDAY EDIT <span>01 / 05</span></div>
      <div class="hanger-line"></div>
      <div class="clothes-row"><div class="garment knit">KNIT</div><div class="garment shirt">SHIRT</div><div class="garment jacket">JACKET</div><div class="garment coat">COAT</div></div>
      <div class="art-caption"><span>CURATE.</span><span>CREATE.</span><span>REPEAT.</span></div>
      <div class="art-sticker">YOUR<br>STYLE<br>DIARY ✳</div>
    </div>
  </section>
  <section class="section intro-section">
    <div><p class="eyebrow">A BETTER WAY TO GET DRESSED</p><h2>Your wardrobe,<br><em>reimagined.</em></h2></div>
    <p class="section-intro">Everything you own, thoughtfully organised in one place. Find pieces faster, try combinations and keep track of the looks you love.</p>
  </section>
  <section class="feature-grid">
    <a class="feature-card feature-one" href="wardrobe.php"><span class="feature-number">01</span><div><span class="feature-icon">▤</span><h3>My Wardrobe</h3><p>See all your pieces, sorted your way.</p><span class="text-link">Organise clothes ↗</span></div></a>
    <a class="feature-card feature-two" href="style-matcher.php"><span class="feature-number">02</span><div><span class="feature-icon">✳</span><h3>Style Matcher</h3><p>Find a look for your plans and mood.</p><span class="text-link">Match my style ↗</span></div></a>
    <a class="feature-card feature-three" href="style-studio.php"><span class="feature-number">03</span><div><span class="feature-icon">✎</span><h3>Style Studio</h3><p>Play with pieces and build an outfit.</p><span class="text-link">Create a look ↗</span></div></a>
  </section>
  <section class="quote-band"><p>“Style is a way to say who you are<br>without having to speak.”</p><span>— YOUR STYLE, YOUR RULES</span></section>
</main>
<footer class="site-footer"><a class="brand" href="index.php">Style<span>Sphere</span></a><p>Made for the love of getting dressed.</p><span>© <?php echo date("Y"); ?> StyleSphere</span></footer>
<script src="js/app.js"></script>
</body></html>