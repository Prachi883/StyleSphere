<?php
// Returns every saved look, newest first:
//   { "success": true, "outfits": [ { "id", "name", "key", "score" (number or null), "filters" {..},
//                                     "saved_at", "items": [ clothing rows ], "missing": 0 } ] }
// "items" are the same columns fetch_clothing.php returns, so js/stylesphere-adapter.js can read them.
// Pieces deleted from the wardrobe are left out and counted in "missing".

require_once __DIR__ . "/outfits_common.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    send_json(["success" => false, "message" => "Invalid request."], 405);
}

try {

    $result = $conn->query(
        "SELECT id, name, outfit_key, top_id, bottom_id, dress_id, outerwear_id, shoes_id, accessory_id,
                match_score, filters_json, created_at
         FROM saved_outfits
         ORDER BY created_at DESC, id DESC"
    );

    $rows = [];
    $needed = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
        foreach (OUTFIT_SLOTS as $slot) {
            if ($row[$slot . "_id"] !== null) {
                $needed[(int)$row[$slot . "_id"]] = true;
            }
        }
    }

    // One query for all the clothing these looks use
    $clothes = [];
    if ($needed) {
        $idList = array_keys($needed);
        $marks = implode(",", array_fill(0, count($idList), "?"));
        $stmt = $conn->prepare(
            "SELECT id, name, category, color, season, occasion, style, image_path
             FROM clothing WHERE id IN ($marks)"
        );
        $stmt->bind_param(str_repeat("i", count($idList)), ...$idList);
        $stmt->execute();
        $clothingResult = $stmt->get_result();
        while ($c = $clothingResult->fetch_assoc()) {
            $clothes[(int)$c["id"]] = $c;
        }
        $stmt->close();
    }

    $outfits = [];
    foreach ($rows as $row) {
        $items = [];
        $missing = 0;
        foreach (OUTFIT_SLOTS as $slot) {
            $id = $row[$slot . "_id"];
            if ($id === null) {
                continue;
            }
            if (isset($clothes[(int)$id])) {
                $items[] = $clothes[(int)$id];
            } else {
                $missing++;
            }
        }

        $filters = $row["filters_json"] ? json_decode($row["filters_json"], true) : [];
        if (!is_array($filters)) {
            $filters = [];
        }

        $outfits[] = [
            "id"       => (int)$row["id"],
            "name"     => $row["name"],
            "key"      => $row["outfit_key"],
            "score"    => $row["match_score"] === null ? null : (int)$row["match_score"],
            "filters"  => (object)$filters,
            "saved_at" => $row["created_at"],
            "items"    => $items,
            "missing"  => $missing,
        ];
    }

    send_json(["success" => true, "outfits" => $outfits]);

} catch (Throwable $e) {

    error_log("get_outfits.php: " . $e->getMessage());
    send_json(["success" => false, "message" => "Could not load saved looks."], 500);
}
