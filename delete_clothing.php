
<?php

require_once "db.php";

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

// Delete clothing using prepared statement
$stmt = $conn->prepare("DELETE FROM clothing WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute() && $stmt->affected_rows > 0) {

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
