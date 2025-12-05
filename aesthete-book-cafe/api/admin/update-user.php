<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../includes/config.php';
require_once '../../includes/db.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// In production, verify admin authentication here

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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

// Check if user exists
$check_stmt = $conn->prepare("SELECT id FROM users WHERE id = ?");
$check_stmt->bind_param("i", $data['id']);
$check_stmt->execute();
$check_stmt->store_result();

if ($check_stmt->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}
$check_stmt->close();

// Check if email is being changed and if it already exists
if (!empty($data['email'])) {
    $email_stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $email_stmt->bind_param("si", $data['email'], $data['id']);
    $email_stmt->execute();
    $email_stmt->store_result();
    
    if ($email_stmt->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already in use']);
        exit;
    }
    $email_stmt->close();
}

// Build update query dynamically
$fields = [];
$values = [];
$types = "";

$allowed_fields = ['username', 'email', 'full_name', 'phone', 'is_admin', 'is_verified'];
foreach ($allowed_fields as $field) {
    if (isset($data[$field])) {
        $fields[] = "$field = ?";
        $values[] = $data[$field];
        $types .= $field === 'is_admin' || $field === 'is_verified' ? "i" : "s";
    }
}

// Handle password change
if (!empty($data['password'])) {
    if (strlen($data['password']) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit;
    }
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    $fields[] = "password = ?";
    $values[] = $hashedPassword;
    $types .= "s";
}

if (empty($fields)) {
    echo json_encode(['success' => false, 'message' => 'No fields to update']);
    exit;
}

// Add user ID to values
$values[] = $data['id'];
$types .= "i";

$sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$values);

if ($stmt->execute()) {
    // If email verification status changed to verified, clear verification token
    if (isset($data['is_verified']) && $data['is_verified']) {
        $token_stmt = $conn->prepare("UPDATE users SET verification_token = NULL WHERE id = ?");
        $token_stmt->bind_param("i", $data['id']);
        $token_stmt->execute();
        $token_stmt->close();
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'User updated successfully'
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update user']);
}

$stmt->close();
$conn->close();
?>