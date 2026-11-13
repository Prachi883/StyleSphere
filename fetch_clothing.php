
<?php

require_once "db.php";

// Set response type to JSON
header("Content-Type: application/json; charset=utf-8");

try {

    // Fetch all clothing records
    $sql = "SELECT id, name, category, color, season,
                   occasion, image_path
            FROM clothing
            ORDER BY created_at DESC";

    $result = $conn->query($sql);

    $clothes = [];

    // Store each database record in an array
    while ($row = $result->fetch_assoc()) {
        $clothes[] = $row;
    }

    // Send records to JavaScript
    echo json_encode($clothes);

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        "error" => "Unable to fetch clothing records."
    ]);

}

$conn->close();

?>
