<?php

// db.php can print a stray blank line. Buffer the output and clean it,
// so the JSON below is always valid and headers can still be sent.
ob_start();
require_once "db.php";
ob_clean();

// Set response type to JSON
header("Content-Type: application/json; charset=utf-8");

try {

    // Fetch all clothing records
    // (the "style" column comes from migrations/001_add_style_column.sql)
    $sql = "SELECT id, name, category, color, season,
                   occasion, style, image_path
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

    error_log("fetch_clothing.php: " . $e->getMessage());
    http_response_code(500);

    echo json_encode([
        "error" => "Unable to fetch clothing records."
    ]);

}

$conn->close();