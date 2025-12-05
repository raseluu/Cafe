<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../includes/config.php';
require_once '../../includes/db.php';

if (!isset($_GET['id'])) {
    echo json_encode(['success' => false, 'message' => 'Event ID is required']);
    exit;
}

$event_id = intval($_GET['id']);
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

$db = Database::getInstance();
$conn = $db->getConnection();

// Get event details
$sql = "SELECT e.*, 
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as total_registrations
        FROM events e WHERE e.id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $event_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Event not found']);
    exit;
}

$event = $result->fetch_assoc();
$stmt->close();

// Check if user is registered
$is_registered = false;
if ($user_id) {
    $checkStmt = $conn->prepare("SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?");
    $checkStmt->bind_param("ii", $event_id, $user_id);
    $checkStmt->execute();
    $checkStmt->store_result();
    $is_registered = $checkStmt->num_rows > 0;
    $checkStmt->close();
}

$event['is_registered'] = $is_registered;

// Get registered users count
$countStmt = $conn->prepare("SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?");
$countStmt->bind_param("i", $event_id);
$countStmt->execute();
$countResult = $countStmt->get_result();
$countData = $countResult->fetch_assoc();
$event['current_participants'] = $countData['count'];
$countStmt->close();

echo json_encode([
    'success' => true,
    'event' => $event
]);

$conn->close();
?>