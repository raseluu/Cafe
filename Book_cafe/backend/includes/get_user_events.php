<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

try {
    $db = getDB();
    $userId = $_SESSION['user_id'];
    
    // Get user's event registrations with event details
    $stmt = $db->prepare("
        SELECT 
            er.id, er.guests, er.status, er.registered_at,
            e.title, e.description, e.event_date, e.event_time, e.location, e.icon
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        WHERE er.user_id = ?
        ORDER BY e.event_date DESC
    ");
    $stmt->execute([$userId]);
    $events = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'events' => $events
    ]);
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Failed to fetch events: ' . $e->getMessage()]);
}
?>