<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$requiredFields = ['name', 'email', 'phone', 'eventId'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        echo json_encode(['success' => false, 'message' => 'Please fill all required fields']);
        exit;
    }
}

// Extract and sanitize data
$name = trim($data['name']);
$email = trim($data['email']);
$phone = trim($data['phone']);
$eventId = intval($data['eventId']);
$guests = isset($data['guests']) ? intval($data['guests']) : 1;
$userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

// Validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit;
}

if ($guests < 1 || $guests > 5) {
    echo json_encode(['success' => false, 'message' => 'Number of guests must be between 1 and 5']);
    exit;
}

try {
    $db = getDB();
    
    // Check if event exists and has seats available
    $stmt = $db->prepare("SELECT title, seats_available FROM events WHERE id = ? AND status = 'active'");
    $stmt->execute([$eventId]);
    $event = $stmt->fetch();
    
    if (!$event) {
        echo json_encode(['success' => false, 'message' => 'Event not found or inactive']);
        exit;
    }
    
    if ($event['seats_available'] < $guests) {
        echo json_encode(['success' => false, 'message' => 'Not enough seats available']);
        exit;
    }
    
    // Check if already registered (by email)
    $stmt = $db->prepare("SELECT id FROM event_registrations WHERE event_id = ? AND email = ?");
    $stmt->execute([$eventId, $email]);
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => false, 'message' => 'You are already registered for this event']);
        exit;
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    // Insert registration
    $stmt = $db->prepare(
        "INSERT INTO event_registrations (user_id, event_id, name, email, phone, guests, status) 
        VALUES (?, ?, ?, ?, ?, ?, 'confirmed')"
    );
    $stmt->execute([$userId, $eventId, $name, $email, $phone, $guests]);
    
    // Update seats available
    $stmt = $db->prepare("UPDATE events SET seats_available = seats_available - ? WHERE id = ?");
    $stmt->execute([$guests, $eventId]);
    
    // Commit transaction
    $db->commit();
    
    echo json_encode([
        'success' => true, 
        'message' => 'Registration successful! You will receive a confirmation email shortly.'
    ]);
    
} catch(PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()]);
}
?>