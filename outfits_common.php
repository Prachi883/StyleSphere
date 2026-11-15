<?php
// Shared set-up for save_outfit.php, get_outfits.php and delete_outfit.php (Person 3).
// Keep this file next to db.php.

// Never show PHP or SQL errors to visitors; they go to the server's error log instead.
ini_set("display_errors", "0");

// Make database problems throw exceptions, so every endpoint can catch them and answer safely.
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// The pieces a look can hold, in the order they are stored and returned,
// and the category each one must have in the `clothing` table.
const OUTFIT_SLOTS = ["top", "bottom", "dress", "shoes", "outerwear", "accessory"];
const SLOT_CATEGORY = [
    "top"       => "Tops",
    "bottom"    => "Bottoms",
    "dress"     => "Dresses",
    "shoes"     => "Footwear",
    "outerwear" => "Outerwear",
    "accessory" => "Accessories",
];

// Send one JSON answer and stop. Every endpoint answers in the same shape:
//   { "success": true|false, "message": "...", ...extra fields }
function send_json(array $data, int $status = 200): void
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code($status);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode($data);
    exit;
}

// Connect using the team's db.php ($conn). db.php can print a stray blank line, so buffer and discard it.
ob_start();
try {
    require_once __DIR__ . "/db.php";
} catch (Throwable $e) {
    error_log("outfits_common.php: " . $e->getMessage());
    send_json(["success" => false, "message" => "The database is not available right now."], 500);
}
ob_clean();
