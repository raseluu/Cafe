<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../includes/config.php';
require_once '../../includes/db.php';

// In production, verify admin authentication here
// For now, we'll accept the request

$db = Database::getInstance();
$conn = $db->getConnection();

// Get query parameters
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
$unread = isset($_GET['unread']) ? $_GET['unread'] === 'true' : false;

// Build query
$sql = "SELECT * FROM contact_messages WHERE 1=1";

if ($unread) {
    $sql .= " AND is_read = FALSE";
}

$sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $limit, $offset);
$stmt->execute();
$result = $stmt->get_result();

$messages = [];
while ($row = $result->fetch_assoc()) {
    // Format date for display
    $row['formatted_date'] = date('M j, Y g:i A', strtotime($row['created_at']));
    $row['message_preview'] = strlen($row['message']) > 100 ? 
        substr($row['message'], 0, 100) . '...' : $row['message'];
    $messages[] = $row;
}

$stmt->close();

// Get total count for pagination
$count_sql = "SELECT COUNT(*) as total FROM contact_messages";
if ($unread) {
    $count_sql .= " WHERE is_read = FALSE";
}

$count_result = $conn->query($count_sql);
$total_count = $count_result->fetch_assoc()['total'];

echo json_encode([
    'success' => true,
    'messages' => $messages,
    'total' => $total_count,
    'unread_count' => $unread ? count($messages) : null
]);

$conn->close();
?>