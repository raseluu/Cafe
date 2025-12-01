<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$requiredFields = ['name', 'email', 'subject', 'message'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        echo json_encode(['success' => false, 'message' => 'Please fill all required fields']);
        exit;
    }
}

// Extract and sanitize data
$name = trim($data['name']);
$email = trim($data['email']);
$phone = isset($data['phone']) ? trim($data['phone']) : null;
$subject = trim($data['subject']);
$message = trim($data['message']);

// Validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit;
}

if (strlen($message) < 10) {
    echo json_encode(['success' => false, 'message' => 'Message must be at least 10 characters']);
    exit;
}

try {
    $db = getDB();
    
    $stmt = $db->prepare(
        "INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->execute([$name, $email, $phone, $subject, $message]);
    
    echo json_encode([
        'success' => true, 
        'message' => 'Thank you for contacting us! We will get back to you within 24 hours.'
    ]);
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Failed to send message: ' . $e->getMessage()]);
}
?>