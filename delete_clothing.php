<?php

// db.php can print a stray blank line. Buffer the output and clean it,
// so the JSON response stays valid.
ob_start();
require_once "db.php";
ob_clean();

header("Content-Type: application/json; charset=utf-8");

// Accept POST requests only
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Invalid request"]);
    exit;
}

// Get clothing ID
$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);

if (!$id || $id < 1) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid clothing ID"]);
    exit;
}

// Find the photo first, so it can be removed together with the record
$imagePath = null;
$find = $conn->prepare("SELECT image_path FROM clothing WHERE id = ?");
$find->bind_param("i", $id);
$find->execute();
$find->bind_result($imagePath);
$find->fetch();
$find->close();

// Delete clothing using prepared statement
$stmt = $conn->prepare("DELETE FROM clothing WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute() && $stmt->affected_rows > 0) {

    // Remove the uploaded photo (only ever inside the uploads folder)
    if ($imagePath) {
        $file = __DIR__ . "/uploads/" . basename($imagePath);
        if (is_file($file)) {
            @unlink($file);
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Clothing deleted successfully"
    ]);

} else {

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Clothing item not found"
    ]);

}

$stmt->close();
$conn->close();

?>
