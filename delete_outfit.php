<?php
// Deletes saved looks. Expects a JSON body with ONE of:
//   { "id": 12 }          delete that look (404 if it does not exist)
//   { "key": "1-9-16" }   delete the look made of exactly those pieces (fine if already gone)
//   { "all": true }       delete every saved look

require_once __DIR__ . "/outfits_common.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    send_json(["success" => false, "message" => "Invalid request."], 405);
}

$body = json_decode(file_get_contents("php://input"), true);
if (!is_array($body)) {
    send_json(["success" => false, "message" => "Invalid data."], 400);
}

try {

    if (($body["all"] ?? false) === true) {

        $conn->query("DELETE FROM saved_outfits");
        send_json(["success" => true, "deleted" => $conn->affected_rows, "message" => "All saved looks deleted."]);

    } elseif (isset($body["id"])) {

        $id = filter_var($body["id"], FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
        if ($id === false) {
            send_json(["success" => false, "message" => "Invalid look id."], 400);
        }
        $stmt = $conn->prepare("DELETE FROM saved_outfits WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $deleted = $stmt->affected_rows;
        $stmt->close();

        if ($deleted < 1) {
            send_json(["success" => false, "message" => "Look not found."], 404);
        }
        send_json(["success" => true, "deleted" => $deleted, "message" => "Look deleted."]);

    } elseif (isset($body["key"])) {

        $key = (string)$body["key"];
        if (!preg_match('/^[0-9]+(-[0-9]+)*$/', $key) || strlen($key) > 120) {
            send_json(["success" => false, "message" => "Invalid look key."], 400);
        }
        $stmt = $conn->prepare("DELETE FROM saved_outfits WHERE outfit_key = ?");
        $stmt->bind_param("s", $key);
        $stmt->execute();
        $deleted = $stmt->affected_rows;
        $stmt->close();

        send_json(["success" => true, "deleted" => $deleted, "message" => "Look deleted."]);

    } else {

        send_json(["success" => false, "message" => "Nothing to delete."], 400);
    }

} catch (Throwable $e) {

    error_log("delete_outfit.php: " . $e->getMessage());
    send_json(["success" => false, "message" => "Could not delete the look."], 500);
}
