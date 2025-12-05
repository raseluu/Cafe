<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../includes/config.php';
require_once '../../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['message_id'])) {
    echo json_encode(['success' => false, 'message' => 'Message ID is required']);
    exit;
}

$message_id = intval($data['message_id']);

$db = Database::getInstance();
$conn = $db->getConnection();

$stmt = $conn->prepare("UPDATE contact_messages SET is_read = TRUE WHERE id = ?");
$stmt->bind_param("i", $message_id);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Message marked as read'
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update message']);
}

$stmt->close();
$conn->close();
?>