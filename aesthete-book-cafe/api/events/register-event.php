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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get authorization header
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

if (!$token) {
    // Try to get from POST data as fallback
    $data = json_decode(file_get_contents('php://input'), true);
    $token = $data['token'] ?? null;
    $event_id = $data['event_id'] ?? null;
    $user_id = $data['user_id'] ?? null;
} else {
    $data = json_decode(file_get_contents('php://input'), true);
    $event_id = $data['event_id'] ?? null;
    $user_id = $data['user_id'] ?? null;
}

if (!$event_id || !$user_id) {
    echo json_encode(['success' => false, 'message' => 'Event ID and User ID are required']);
    exit;
}

$db = Database::getInstance();
$conn = $db->getConnection();

// Verify user exists
$userStmt = $conn->prepare("SELECT id, email, username FROM users WHERE id = ?");
$userStmt->bind_param("i", $user_id);
$userStmt->execute();
$userResult = $userStmt->get_result();

if ($userResult->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

$user = $userResult->fetch_assoc();
$userStmt->close();

// Get event details
$eventStmt = $conn->prepare("SELECT * FROM events WHERE id = ?");
$eventStmt->bind_param("i", $event_id);
$eventStmt->execute();
$eventResult = $eventStmt->get_result();

if ($eventResult->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Event not found']);
    exit;
}

$event = $eventResult->fetch_assoc();
$eventStmt->close();

// Check if event is full
if ($event['max_participants'] > 0) {
    $countStmt = $conn->prepare("SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?");
    $countStmt->bind_param("i", $event_id);
    $countStmt->execute();
    $countResult = $countStmt->get_result();
    $countData = $countResult->fetch_assoc();
    $countStmt->close();
    
    if ($countData['count'] >= $event['max_participants']) {
        echo json_encode(['success' => false, 'message' => 'Event is full']);
        exit;
    }
}

// Check if user is already registered
$checkStmt = $conn->prepare("SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?");
$checkStmt->bind_param("ii", $event_id, $user_id);
$checkStmt->execute();
$checkStmt->store_result();

if ($checkStmt->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'You are already registered for this event']);
    $checkStmt->close();
    exit;
}
$checkStmt->close();

// Register user for event
$registerStmt = $conn->prepare("INSERT INTO event_registrations (event_id, user_id, status) VALUES (?, ?, 'confirmed')");
$registerStmt->bind_param("ii", $event_id, $user_id);

if ($registerStmt->execute()) {
    // Update event participant count
    $updateStmt = $conn->prepare("UPDATE events SET current_participants = current_participants + 1 WHERE id = ?");
    $updateStmt->bind_param("i", $event_id);
    $updateStmt->execute();
    $updateStmt->close();
    
    // Send confirmation email
    $emailSent = Mailer::sendEventRegistration(
        $user['email'],
        $event['title'],
        $event['event_date'],
        $event['event_time']
    );
    
    echo json_encode([
        'success' => true,
        'message' => 'Successfully registered for the event!',
        'registration_id' => $registerStmt->insert_id,
        'email_sent' => $emailSent
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again.']);
}

$registerStmt->close();
$conn->close();
?>