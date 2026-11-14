<?php

// db.php can print a stray blank line. Buffer the output and clean it,
// so the redirect below can still send its header.
ob_start();
require_once "db.php";
ob_clean();

// Accept POST requests only
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    exit("Invalid request.");
}

// Get form information
$name = trim($_POST["name"] ?? "");
$category = trim($_POST["category"] ?? "");
$color = trim($_POST["color"] ?? "");
$season = trim($_POST["season"] ?? "");
$occasion = trim($_POST["occasion"] ?? "");
$style = trim($_POST["style"] ?? "");

if ($name === "" || $category === "") {
    exit("Name and category are required.");
}

// The Style Matcher relies on exact values, so only accept the ones the form offers
$allowedCategories = ["Tops", "Bottoms", "Dresses", "Outerwear", "Footwear", "Accessories"];
$allowedSeasons    = ["All season", "Summer", "Winter", "Monsoon"];
$allowedOccasions  = ["Everyday", "College", "Party", "Formal", "Festive"];
$allowedStyles     = ["casual", "chic", "streetwear", "formal", "minimal", "festive"];
// Colours match COLOR_HEX in js/recommendation-engine.js (keep the two lists in sync)
$allowedColors     = ["White", "Black", "Grey", "Beige", "Cream", "Blue", "Brown", "Olive",
                      "Pink", "Burgundy", "Red", "Green", "Yellow", "Purple", "Orange"];

if (!in_array($category, $allowedCategories, true)) {
    exit("Invalid category.");
}

if ($season === "")   { $season = "All season"; }
if ($occasion === "") { $occasion = "Everyday"; }

if (!in_array($season, $allowedSeasons, true)) {
    exit("Invalid season.");
}
if (!in_array($occasion, $allowedOccasions, true)) {
    exit("Invalid occasion.");
}
if (!in_array($color, $allowedColors, true)) {
    exit("Please choose a colour.");
}
if (!in_array($style, $allowedStyles, true)) {
    exit("Please choose a style.");
}

// Keep free-text fields to a sensible length
$name = mb_substr($name, 0, 100);

// Image path is optional
$imagePath = null;
$uploadedFilePath = null;

// Check whether an image was selected
if (isset($_FILES["image"]) &&
    $_FILES["image"]["error"] !== UPLOAD_ERR_NO_FILE) {

    $file = $_FILES["image"];

    // Check upload errors
    if ($file["error"] !== UPLOAD_ERR_OK) {
        exit("Image upload failed.");
    }

    // Maximum image size: 5 MB
    if ($file["size"] > 5 * 1024 * 1024) {
        exit("Image must be smaller than 5 MB.");
    }

    // Check actual image type
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file["tmp_name"]);

    $allowedTypes = [
        "image/jpeg" => "jpg",
        "image/png"  => "png",
        "image/webp" => "webp"
    ];

    if (!isset($allowedTypes[$mime])) {
        exit("Only JPG, PNG and WebP images are allowed.");
    }

    // Create uploads folder if necessary
    $uploadDir = __DIR__ . "/uploads/";

    if (!is_dir($uploadDir) &&
        !mkdir($uploadDir, 0755, true)) {
        exit("Unable to create uploads folder.");
    }

    // Generate a unique filename
    $fileName = bin2hex(random_bytes(16))
                . "." . $allowedTypes[$mime];

    $destination = $uploadDir . $fileName;

    // Save image on the server
    if (!move_uploaded_file(
        $file["tmp_name"],
        $destination
    )) {
        exit("Unable to save image.");
    }

    $imagePath = "uploads/" . $fileName;
    $uploadedFilePath = $destination;
}

// Insert clothing information into MySQL
$sql = "INSERT INTO clothing
        (name, category, color, season, occasion, style, image_path)
        VALUES (?, ?, ?, ?, ?, ?, ?)";

try {

    $stmt = $conn->prepare($sql);

    $stmt->bind_param(
        "sssssss",
        $name,
        $category,
        $color,
        $season,
        $occasion,
        $style,
        $imagePath
    );

    $stmt->execute();

    $stmt->close();
    $conn->close();

    // Return to wardrobe after successful insertion
    header("Location: wardrobe.php?added=1");
    exit;

} catch (Throwable $error) {

    // Remove the uploaded image if database insertion fails
    if ($uploadedFilePath &&
        file_exists($uploadedFilePath)) {
        unlink($uploadedFilePath);
    }

    error_log($error->getMessage());

    http_response_code(500);
    exit("Unable to save clothing information.");

}

?>