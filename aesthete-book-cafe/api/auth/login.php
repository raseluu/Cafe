<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../includes/config.php';
require_once '../../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['email']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and password are required']);
    exit;
}

$db = Database::getInstance();
$conn = $db->getConnection();

// Get user by email
$stmt = $conn->prepare("SELECT id, username, email, password, is_verified, is_admin FROM users WHERE email = ?");
$stmt->bind_param("s", $data['email']);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

// Verify password - IMPORTANT: For admin@aesthetebookcafe.com with password 'admin123'
// If you hashed the password differently, adjust this
if ($data['email'] === 'admin@aesthetebookcafe.com' && $data['password'] === 'admin123') {
    // Direct match for admin (temporary for testing)
    $passwordValid = true;
} else {
    // Normal password verification
    $passwordValid = password_verify($data['password'], $user['password']);
}

if (!$passwordValid) {
    echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
    exit;
}

// Check if email is verified (except for admin)
if (!$user['is_verified'] && $data['email'] !== 'admin@aesthetebookcafe.com') {
    echo json_encode(['success' => false, 'message' => 'Please verify your email address before logging in']);
    exit;
}

// Generate simple token (in production use JWT)
$token = bin2hex(random_bytes(32));

// Remove password from response
unset($user['password']);

echo json_encode([
    'success' => true,
    'message' => 'Login successful',
    'token' => $token,
    'user' => $user
]);

$conn->close();
?>


