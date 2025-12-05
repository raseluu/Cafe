<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../includes/config.php';
require_once '../../includes/db.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// In production, verify admin authentication here

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['id'])) {
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit;
}

$db = Database::getInstance();
$conn = $db->getConnection();

// Check if user exists and is not the last admin
$check_stmt = $conn->prepare("
    SELECT is_admin, 
           (SELECT COUNT(*) FROM users WHERE is_admin = TRUE) as admin_count 
    FROM users 
    WHERE id = ?
");
$check_stmt->bind_param("i", $data['id']);
$check_stmt->execute();
$check_result = $check_stmt->get_result();

if ($check_result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

$user_data = $check_result->fetch_assoc();
$check_stmt->close();

// Prevent deleting the last admin
if ($user_data['is_admin'] && $user_data['admin_count'] <= 1) {
    echo json_encode([
        'success' => false, 
        'message' => 'Cannot delete the last administrator. Please assign another admin first.'
    ]);
    exit;
}

// Delete user
$stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
$stmt->bind_param("i", $data['id']);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'User deleted successfully'
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete user']);
}

$stmt->close();
$conn->close();
?>