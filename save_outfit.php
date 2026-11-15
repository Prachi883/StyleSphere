<?php
// Saves one look. Expects a JSON body such as:
//   { "name": "Campus edit", "top_id": 1, "bottom_id": 9, "shoes_id": 16,
//     "score": 91, "filters": { "occasion": "college", "weather": "hot", "style": "chic" } }
// Slots that are not part of the look are null or left out. "score" and "filters" are optional.

require_once __DIR__ . "/outfits_common.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    send_json(["success" => false, "message" => "Invalid request."], 405);
}

$body = json_decode(file_get_contents("php://input"), true);
if (!is_array($body)) {
    send_json(["success" => false, "message" => "Invalid data."], 400);
}

// ---- Name ----
$name = mb_substr(trim((string)($body["name"] ?? "")), 0, 100);
if ($name === "") {
    $name = "My look";
}

// ---- Clothing ids (whole numbers of 1 or more, or null) ----
$ids = [];
foreach (OUTFIT_SLOTS as $slot) {
    $value = $body[$slot . "_id"] ?? null;
    if ($value === null || $value === "") {
        $ids[$slot] = null;
        continue;
    }
    $int = filter_var($value, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    if ($int === false) {
        send_json(["success" => false, "message" => "Invalid clothing id."], 400);
    }
    $ids[$slot] = $int;
}

$chosen = array_filter($ids, fn($id) => $id !== null);
if (count($chosen) < 2) {
    send_json(["success" => false, "message" => "Choose at least two pieces."], 400);
}
if ($ids["dress"] !== null && ($ids["top"] !== null || $ids["bottom"] !== null)) {
    send_json(["success" => false, "message" => "A dress cannot be combined with a top or bottom."], 400);
}
if (count(array_unique($chosen)) !== count($chosen)) {
    send_json(["success" => false, "message" => "The same piece was chosen twice."], 400);
}

// ---- Optional match score (0-100) ----
$score = null;
if (isset($body["score"]) && is_numeric($body["score"])) {
    $rounded = (int)round((float)$body["score"]);
    if ($rounded >= 0 && $rounded <= 100) {
        $score = $rounded;
    }
}

// ---- Optional filters (only three known keys, short text) ----
$filters = [];
if (isset($body["filters"]) && is_array($body["filters"])) {
    foreach (["occasion", "weather", "style"] as $key) {
        if (isset($body["filters"][$key]) && is_string($body["filters"][$key])) {
            $text = mb_substr(trim($body["filters"][$key]), 0, 30);
            if ($text !== "") {
                $filters[$key] = $text;
            }
        }
    }
}
$filtersJson = $filters ? json_encode($filters) : null;

try {

    // ---- Every piece must really exist in the wardrobe, in the right category ----
    $idList = array_values($chosen);
    $marks = implode(",", array_fill(0, count($idList), "?"));
    $stmt = $conn->prepare("SELECT id, category FROM clothing WHERE id IN ($marks)");
    $stmt->bind_param(str_repeat("i", count($idList)), ...$idList);
    $stmt->execute();
    $result = $stmt->get_result();
    $found = [];
    while ($row = $result->fetch_assoc()) {
        $found[(int)$row["id"]] = $row["category"];
    }
    $stmt->close();

    foreach ($chosen as $slot => $id) {
        if (!isset($found[$id])) {
            send_json(["success" => false, "message" => "One of the pieces is not in your wardrobe."], 400);
        }
        if ($found[$id] !== SLOT_CATEGORY[$slot]) {
            send_json(["success" => false, "message" => "A piece does not match its category."], 400);
        }
    }

    // ---- Same pieces = same look: never save it twice ----
    sort($idList, SORT_NUMERIC);
    $key = implode("-", $idList);

    $check = $conn->prepare("SELECT id FROM saved_outfits WHERE outfit_key = ?");
    $check->bind_param("s", $key);
    $check->execute();
    $check->bind_result($existingId);
    if ($check->fetch()) {
        $check->close();
        send_json(["success" => true, "id" => (int)$existingId, "already_saved" => true, "message" => "This look is already saved."]);
    }
    $check->close();

    // ---- Insert ----
    $insert = $conn->prepare(
        "INSERT INTO saved_outfits
            (name, outfit_key, top_id, bottom_id, dress_id, outerwear_id, shoes_id, accessory_id, match_score, filters_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $insert->bind_param(
        "ssiiiiiiis",
        $name, $key,
        $ids["top"], $ids["bottom"], $ids["dress"], $ids["outerwear"], $ids["shoes"], $ids["accessory"],
        $score, $filtersJson
    );
    $insert->execute();
    $newId = $insert->insert_id;
    $insert->close();

    send_json(["success" => true, "id" => (int)$newId, "already_saved" => false, "message" => "Look saved."], 201);

} catch (mysqli_sql_exception $e) {

    // 1062 = two requests saved the same look at the same moment; the look is saved, so say so.
    if ((int)$e->getCode() === 1062) {
        send_json(["success" => true, "already_saved" => true, "message" => "This look is already saved."]);
    }
    error_log("save_outfit.php: " . $e->getMessage());
    send_json(["success" => false, "message" => "Could not save the look."], 500);

} catch (Throwable $e) {

    error_log("save_outfit.php: " . $e->getMessage());
    send_json(["success" => false, "message" => "Could not save the look."], 500);
}
