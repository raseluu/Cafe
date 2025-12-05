<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../includes/config.php';
require_once '../../includes/db.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// In production, verify admin authentication here
// For demo, we'll accept the request

$db = Database::getInstance();
$conn = $db->getConnection();

// Get query parameters
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
$role = isset($_GET['role']) ? $_GET['role'] : null;
$status = isset($_GET['status']) ? $_GET['status'] : null;
$date = isset($_GET['date']) ? $_GET['date'] : null;
$search = isset($_GET['search']) ? $_GET['search'] : null;
$count_only = isset($_GET['count']) && $_GET['count'] === 'true';

// Build base query
$sql = "SELECT id, username, email, full_name, phone, is_verified, is_admin, created_at FROM users WHERE 1=1";
$count_sql = "SELECT COUNT(*) as total FROM users WHERE 1=1";
$params = [];
$types = "";

// Apply filters
if ($role === 'admin') {
    $sql .= " AND is_admin = TRUE";
    $count_sql .= " AND is_admin = TRUE";
} elseif ($role === 'user') {
    $sql .= " AND is_admin = FALSE";
    $count_sql .= " AND is_admin = FALSE";
}

if ($status === 'verified') {
    $sql .= " AND is_verified = TRUE";
    $count_sql .= " AND is_verified = TRUE";
} elseif ($status === 'unverified') {
    $sql .= " AND is_verified = FALSE";
    $count_sql .= " AND is_verified = FALSE";
}

if ($date) {
    $date_condition = "";
    switch($date) {
        case 'today':
            $date_condition = "DATE(created_at) = CURDATE()";
            break;
        case 'week':
            $date_condition = "created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
            break;
        case 'month':
            $date_condition = "created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
            break;
    }
    if ($date_condition) {
        $sql .= " AND " . $date_condition;
        $count_sql .= " AND " . $date_condition;
    }
}

if ($search) {
    $search_term = "%" . $search . "%";
    $sql .= " AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)";
    $count_sql .= " AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)";
    $params = array_merge($params, [$search_term, $search_term, $search_term]);
    $types .= "sss";
}

// Get total count
if (!empty($params)) {
    $stmt = $conn->prepare($count_sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $count_result = $stmt->get_result();
    $total_count = $count_result->fetch_assoc()['total'];
    $stmt->close();
} else {
    $count_result = $conn->query($count_sql);
    $total_count = $count_result->fetch_assoc()['total'];
}

if ($count_only) {
    echo json_encode([
        'success' => true,
        'count' => $total_count
    ]);
    exit;
}

// Add ordering and pagination
$sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
$params = array_merge($params, [$limit, $offset]);
$types .= "ii";

// Execute query
$stmt = $conn->prepare($sql);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$users = [];
while ($row = $result->fetch_assoc()) {
    // Format dates for display
    $row['created_at_formatted'] = date('M j, Y', strtotime($row['created_at']));
    $users[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode([
    'success' => true,
    'users' => $users,
    'total' => $total_count,
    'page' => floor($offset / $limit) + 1,
    'total_pages' => ceil($total_count / $limit)
]);
?>