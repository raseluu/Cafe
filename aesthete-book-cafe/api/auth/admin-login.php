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

// Check if it's the admin email
if ($data['email'] !== 'admin@aesthetebookcafe.com') {
    echo json_encode(['success' => false, 'message' => 'Admin access only']);
    exit;
}

// Get admin user
$stmt = $conn->prepare("SELECT id, username, email, password, is_verified, is_admin FROM users WHERE email = ? AND is_admin = TRUE");
$stmt->bind_param("s", $data['email']);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Admin account not found']);
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

// Check password - use direct match for admin123
$passwordValid = false;
if ($data['password'] === 'admin123') {
    $passwordValid = true;
} else {
    // Fallback to password verification
    $passwordValid = password_verify($data['password'], $user['password']);
}

if (!$passwordValid) {
    echo json_encode(['success' => false, 'message' => 'Invalid password']);
    exit;
}

// Generate admin token
$token = 'admin-' . bin2hex(random_bytes(32));

// Remove password from response
unset($user['password']);

echo json_encode([
    'success' => true,
    'message' => 'Admin login successful',
    'token' => $token,
    'user' => $user
]);

$conn->close();
?>


