-- StyleSphere | Person 3 | saved outfits table
-- Run once in phpMyAdmin: select the `stylesphere` database -> SQL tab -> paste -> Go.
--
-- Each row is one saved look. It stores the ids of the clothing pieces (from Person 1's
-- `clothing` table), not copies of them, so names/colours/photos always come from the wardrobe.
-- There is deliberately no FOREIGN KEY: get_outfits.php simply skips pieces that were deleted
-- from the wardrobe, so deleting a clothing item never fails or breaks a saved look.

CREATE TABLE IF NOT EXISTS saved_outfits (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL,
    outfit_key    VARCHAR(120) NOT NULL,          -- sorted clothing ids, e.g. "1-9-16"; same pieces = same look
    top_id        INT NULL,
    bottom_id     INT NULL,
    dress_id      INT NULL,
    outerwear_id  INT NULL,
    shoes_id      INT NULL,
    accessory_id  INT NULL,
    match_score   TINYINT UNSIGNED NULL,          -- only set for looks that came from Style Matcher
    filters_json  VARCHAR(500) NULL,              -- {"occasion":"..","weather":"..","style":".."} when known
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_saved_outfits_key (outfit_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
