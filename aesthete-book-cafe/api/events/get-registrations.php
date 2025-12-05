<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../includes/config.php';
require_once '../../includes/db.php';

$db = Database::getInstance();
$conn = $db->getConnection();

$event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : null;
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

if ($event_id) {
    // Get registrations for specific event
    $sql = "SELECT er.*, u.username, u.email, u.full_name 
            FROM event_registrations er
            JOIN users u ON er.user_id = u.id
            WHERE er.event_id = ?
            ORDER BY er.registration_date DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $event_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $registrations = [];
    while ($row = $result->fetch_assoc()) {
        $registrations[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'registrations' => $registrations,
        'count' => count($registrations)
    ]);
    
    $stmt->close();
} elseif ($user_id) {
    // Get events user is registered for
    $sql = "SELECT e.*, er.registration_date, er.status 
            FROM event_registrations er
            JOIN events e ON er.event_id = e.id
            WHERE er.user_id = ?
            ORDER BY e.event_date DESC, e.event_time DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $events = [];
    while ($row = $result->fetch_assoc()) {
        $events[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'events' => $events,
        'count' => count($events)
    ]);
    
    $stmt->close();
} else {
    // Get all registrations (admin view)
    $sql = "SELECT er.*, e.title as event_title, u.username, u.email, u.full_name 
            FROM event_registrations er
            JOIN events e ON er.event_id = e.id
            JOIN users u ON er.user_id = u.id
            ORDER BY er.registration_date DESC
            LIMIT 100";
    
    $result = $conn->query($sql);
    
    $registrations = [];
    while ($row = $result->fetch_assoc()) {
        $registrations[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'registrations' => $registrations,
        'count' => count($registrations)
    ]);
}

$conn->close();
?>