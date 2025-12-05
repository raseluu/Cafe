<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../includes/config.php';
require_once '../../includes/db.php';

$db = Database::getInstance();
$conn = $db->getConnection();

// Check for featured parameter
$featured = isset($_GET['featured']) ? $_GET['featured'] === 'true' : false;
$category = isset($_GET['category']) ? $_GET['category'] : null;

// Build query
$sql = "SELECT * FROM books WHERE 1=1";
$params = [];
$types = "";

if ($featured) {
    $sql .= " AND is_featured = TRUE";
}

if ($category) {
    $sql .= " AND category = ?";
    $params[] = $category;
    $types .= "s";
}

$sql .= " ORDER BY created_at DESC";

if (isset($_GET['limit'])) {
    $sql .= " LIMIT ?";
    $params[] = intval($_GET['limit']);
    $types .= "i";
}

if (!empty($params)) {
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $conn->query($sql);
}

$books = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $books[] = $row;
    }
}

echo json_encode([
    'success' => true,
    'books' => $books,
    'count' => count($books)
]);

if (isset($stmt)) {
    $stmt->close();
}
$conn->close();
?>