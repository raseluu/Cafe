<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../models/User.php';

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($data['currentPassword']) || !isset($data['newPassword'])) {
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit;
}

$currentPassword = $data['currentPassword'];
$newPassword = $data['newPassword'];

// Validation
if (strlen($newPassword) < 8) {
    echo json_encode(['success' => false, 'message' => 'New password must be at least 8 characters']);
    exit;
}

// Change password
$user = new User();
$result = $user->changePassword($_SESSION['user_id'], $currentPassword, $newPassword);

echo json_encode($result);
?>