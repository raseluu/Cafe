<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../includes/config.php';
require_once '../../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get token from URL
$token = isset($_GET['token']) ? $_GET['token'] : '';

if (empty($token)) {
    echo json_encode(['success' => false, 'message' => 'Invalid verification token']);
    exit;
}

$db = Database::getInstance();
$conn = $db->getConnection();

// Find user by verification token
$stmt = $conn->prepare("SELECT id FROM users WHERE verification_token = ? AND is_verified = FALSE");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid or expired verification token']);
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

// Update user as verified
$stmt = $conn->prepare("UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?");
$stmt->bind_param("i", $user['id']);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Email verified successfully! You can now login.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Verification failed. Please try again.']);
}

$stmt->close();
$conn->close();
?>