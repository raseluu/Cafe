<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../includes/config.php';
require_once '../../includes/db.php';

$db = Database::getInstance();
$conn = $db->getConnection();

// Get query parameters
$upcoming = isset($_GET['upcoming']) ? $_GET['upcoming'] === 'true' : false;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : null;
$event_id = isset($_GET['id']) ? intval($_GET['id']) : null;

// Build query
if ($event_id) {
    // Get single event
    $sql = "SELECT * FROM events WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $event_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $event = $result->fetch_assoc();
        
        // Check if user is registered (if user ID provided)
        $is_registered = false;
        if (isset($_GET['user_id'])) {
            $user_id = intval($_GET['user_id']);
            $checkStmt = $conn->prepare("SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?");
            $checkStmt->bind_param("ii", $event_id, $user_id);
            $checkStmt->execute();
            $checkStmt->store_result();
            $is_registered = $checkStmt->num_rows > 0;
            $checkStmt->close();
            
            $event['is_registered'] = $is_registered;
        }
        
        echo json_encode([
            'success' => true,
            'event' => $event
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Event not found'
        ]);
    }
    
    $stmt->close();
} else {
    // Get multiple events
    $sql = "SELECT * FROM events WHERE 1=1";
    
    if ($upcoming) {
        $sql .= " AND event_date >= CURDATE()";
    }
    
    $sql .= " ORDER BY event_date ASC, event_time ASC";
    
    if ($limit) {
        $sql .= " LIMIT ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $limit);
    } else {
        $stmt = $conn->prepare($sql);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $events = [];
    while ($row = $result->fetch_assoc()) {
        // Calculate available spots
        if ($row['max_participants'] > 0) {
            $row['available_spots'] = $row['max_participants'] - $row['current_participants'];
        } else {
            $row['available_spots'] = null;
        }
        $events[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'events' => $events,
        'count' => count($events)
    ]);
    
    $stmt->close();
}

$conn->close();
?>