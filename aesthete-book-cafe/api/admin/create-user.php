<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../includes/config.php';
require_once '../../includes/db.php';
require_once '../../includes/mail.php';

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

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

// Validate required fields
$required = ['username', 'email', 'password'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        echo json_encode(['success' => false, 'message' => "$field is required"]);
        exit;
    }
}

// Validate email
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

// Validate password length
if (strlen($data['password']) < 6) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
    exit;
}

$db = Database::getInstance();
$conn = $db->getConnection();

// Check if username already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$stmt->bind_param("s", $data['username']);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Username already exists']);
    exit;
}
$stmt->close();

// Check if email already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $data['email']);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Email already registered']);
    exit;
}
$stmt->close();

// Hash password
$hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
$verificationToken = $data['email_verified'] ? null : bin2hex(random_bytes(32));

// Prepare user data
$is_admin = isset($data['is_admin']) ? (bool)$data['is_admin'] : false;
$is_verified = isset($data['email_verified']) ? (bool)$data['email_verified'] : false;
$full_name = $data['full_name'] ?? null;
$phone = $data['phone'] ?? null;

// Insert user
$stmt = $conn->prepare("
    INSERT INTO users (username, email, password, full_name, phone, is_admin, is_verified, verification_token) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt->bind_param(
    "sssssiis",
    $data['username'],
    $data['email'],
    $hashedPassword,
    $full_name,
    $phone,
    $is_admin,
    $is_verified,
    $verificationToken
);

if ($stmt->execute()) {
    $user_id = $stmt->insert_id;
    
    // Send welcome email if requested
    $email_sent = false;
    if (isset($data['send_welcome_email']) && $data['send_welcome_email']) {
        if ($is_verified) {
            // Send welcome email for verified accounts
            $email_sent = Mailer::sendWelcomeEmail($data['email'], $data['username']);
        } else {
            // Send verification email
            $email_sent = Mailer::sendVerificationEmail($data['email'], $data['username'], $verificationToken);
        }
    }
    
    // Create user settings entry
    $settings_stmt = $conn->prepare("INSERT INTO user_settings (user_id) VALUES (?)");
    $settings_stmt->bind_param("i", $user_id);
    $settings_stmt->execute();
    $settings_stmt->close();
    
    echo json_encode([
        'success' => true,
        'message' => 'User created successfully',
        'user_id' => $user_id,
        'email_sent' => $email_sent
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to create user']);
}

$stmt->close();
$conn->close();
?>