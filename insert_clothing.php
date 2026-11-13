
<?php

require_once "db.php";

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

if ($name === "" || $category === "") {
    exit("Name and category are required.");
}

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
        (name, category, color, season, occasion, image_path)
        VALUES (?, ?, ?, ?, ?, ?)";

try {

    $stmt = $conn->prepare($sql);

    $stmt->bind_param(
        "ssssss",
        $name,
        $category,
        $color,
        $season,
        $occasion,
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
