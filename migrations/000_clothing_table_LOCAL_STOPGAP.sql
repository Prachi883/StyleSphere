-- ============================================================================
-- StyleSphere Clothing Table Schema
-- Creates the main clothing table used by My Wardrobe, Style Matcher,
-- Style Studio, and the saved outfits backend.
--
-- This is the project's base clothing schema.
-- The `style` column is included here, so 001_add_style_column.sql
-- is no longer required.
-- ============================================================================
CREATE TABLE IF NOT EXISTS clothing (
    id          INT NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    category    VARCHAR(30)  NOT NULL,
    color       VARCHAR(30)  NOT NULL,
    season      VARCHAR(30)  NOT NULL DEFAULT 'All season',
    occasion    VARCHAR(30)  NOT NULL DEFAULT 'Everyday',
    style       VARCHAR(30)  NULL,
    image_path  VARCHAR(255) NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
