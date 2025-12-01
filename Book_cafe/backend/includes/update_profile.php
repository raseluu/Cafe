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
if (!isset($data['name']) || !isset($data['phone'])) {
    echo json_encode(['success' => false, 'message' => 'Name and phone are required']);
    exit;
}

$name = trim($data['name']);
$phone = trim($data['phone']);

// Validation
if (strlen($name) < 3) {
    echo json_encode(['success' => false, 'message' => 'Name must be at least 3 characters']);
    exit;
}

// Update profile
$user = new User();
$result = $user->updateProfile($_SESSION['user_id'], $name, $phone);

// Update session name
if ($result['success']) {
    $_SESSION['user_name'] = $name;
}

echo json_encode($result);
?>