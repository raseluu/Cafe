<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../includes/config.php';
require_once '../../includes/db.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// In production, verify admin authentication here

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['action']) || empty($data['user_ids'])) {
    echo json_encode(['success' => false, 'message' => 'Action and user IDs are required']);
    exit;
}

$db = Database::getInstance();
$conn = $db->getConnection();

$user_ids = array_map('intval', $data['user_ids']);
$placeholders = implode(',', array_fill(0, count($user_ids), '?'));
$types = str_repeat('i', count($user_ids));

$affected_rows = 0;
$message = '';

switch ($data['action']) {
    case 'delete':
        // Don't allow deleting all admins
        $admin_check = $conn->prepare("
            SELECT COUNT(*) as admin_count 
            FROM users 
            WHERE is_admin = TRUE AND id NOT IN ($placeholders)
        ");
        $admin_check->bind_param($types, ...$user_ids);
        $admin_check->execute();
        $admin_result = $admin_check->get_result()->fetch_assoc();
        $admin_check->close();
        
        if ($admin_result['admin_count'] === 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'Cannot delete all administrators. At least one admin must remain.'
            ]);
            exit;
        }
        
        $stmt = $conn->prepare("DELETE FROM users WHERE id IN ($placeholders)");
        $stmt->bind_param($types, ...$user_ids);
        $stmt->execute();
        $affected_rows = $stmt->affected_rows;
        $stmt->close();
        
        $message = "Deleted $affected_rows user(s)";
        break;
        
    case 'verify':
        $stmt = $conn->prepare("
            UPDATE users 
            SET is_verified = TRUE, verification_token = NULL 
            WHERE id IN ($placeholders)
        ");
        $stmt->bind_param($types, ...$user_ids);
        $stmt->execute();
        $affected_rows = $stmt->affected_rows;
        $stmt->close();
        
        $message = "Verified $affected_rows user(s)";
        break;
        
    case 'make_admin':
        $stmt = $conn->prepare("UPDATE users SET is_admin = TRUE WHERE id IN ($placeholders)");
        $stmt->bind_param($types, ...$user_ids);
        $stmt->execute();
        $affected_rows = $stmt->affected_rows;
        $stmt->close();
        
        $message = "Made $affected_rows user(s) administrators";
        break;
        
    case 'remove_admin':
        // Don't allow removing admin from all users
        $remaining_admins = $conn->prepare("
            SELECT COUNT(*) as admin_count 
            FROM users 
            WHERE is_admin = TRUE AND id NOT IN ($placeholders)
        ");
        $remaining_admins->bind_param($types, ...$user_ids);
        $remaining_admins->execute();
        $remaining_result = $remaining_admins->get_result()->fetch_assoc();
        $remaining_admins->close();
        
        if ($remaining_result['admin_count'] === 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'Cannot remove admin privileges from all users. At least one admin must remain.'
            ]);
            exit;
        }
        
        $stmt = $conn->prepare("UPDATE users SET is_admin = FALSE WHERE id IN ($placeholders)");
        $stmt->bind_param($types, ...$user_ids);
        $stmt->execute();
        $affected_rows = $stmt->affected_rows;
        $stmt->close();
        
        $message = "Removed admin privileges from $affected_rows user(s)";
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        exit;
}

echo json_encode([
    'success' => true,
    'message' => $message,
    'affected_rows' => $affected_rows
]);

$conn->close();
?>