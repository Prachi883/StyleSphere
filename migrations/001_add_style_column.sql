-- StyleSphere: add the "style" column used by the Style Matcher.
-- Run ONCE in phpMyAdmin (SQL tab) on the "stylesphere" database,
-- BEFORE using the updated fetch_clothing.php / insert_clothing.php.
--
-- Allowed values (enforced by insert_clothing.php and the wardrobe form):
--   casual, chic, streetwear, formal, minimal, festive
-- Existing rows keep NULL; the recommendation engine gives them neutral style points.

ALTER TABLE clothing
    ADD COLUMN style VARCHAR(20) DEFAULT NULL AFTER occasion;