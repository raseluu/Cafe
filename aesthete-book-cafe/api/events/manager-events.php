<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../includes/config.php';
require_once '../../includes/db.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = Database::getInstance();
$conn = $db->getConnection();

// Get authorization header
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

// In production, verify the token and check admin privileges
// For now, we'll accept it for demonstration

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Get all events for admin (with registration counts)
        $sql = "SELECT e.*, 
                (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as total_registrations
                FROM events e 
                ORDER BY e.event_date DESC, e.event_time DESC";
        
        $result = $conn->query($sql);
        
        $events = [];
        while ($row = $result->fetch_assoc()) {
            $events[] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'events' => $events,
            'count' => count($events)
        ]);
        break;
        
    case 'POST':
        // Create new event
        $data = json_decode(file_get_contents('php://input'), true);
        
        $required = ['title', 'event_date', 'event_time'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                echo json_encode(['success' => false, 'message' => "$field is required"]);
                exit;
            }
        }
        
        $stmt = $conn->prepare("
            INSERT INTO events (title, description, event_date, event_time, venue, price, image_url, max_participants) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->bind_param(
            "sssssdsi",
            $data['title'],
            $data['description'] ?? null,
            $data['event_date'],
            $data['event_time'],
            $data['venue'] ?? null,
            $data['price'] ?? 0,
            $data['image_url'] ?? null,
            $data['max_participants'] ?? null
        );
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Event created successfully',
                'event_id' => $stmt->insert_id
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create event']);
        }
        
        $stmt->close();
        break;
        
    case 'PUT':
        // Update event
        parse_str(file_get_contents('php://input'), $_PUT);
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['id'])) {
            echo json_encode(['success' => false, 'message' => 'Event ID is required']);
            exit;
        }
        
        // Build update query dynamically based on provided fields
        $fields = [];
        $values = [];
        $types = '';
        
        $allowedFields = ['title', 'description', 'event_date', 'event_time', 'venue', 'price', 'image_url', 'max_participants'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
                $types .= $field === 'price' ? 'd' : 's';
            }
        }
        
        if (empty($fields)) {
            echo json_encode(['success' => false, 'message' => 'No fields to update']);
            exit;
        }
        
        // Add ID at the end
        $values[] = $data['id'];
        $types .= 'i';
        
        $sql = "UPDATE events SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$values);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Event updated successfully'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update event']);
        }
        
        $stmt->close();
        break;
        
    case 'DELETE':
        // Delete event
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['id'])) {
            echo json_encode(['success' => false, 'message' => 'Event ID is required']);
            exit;
        }
        
        // Check if there are registrations
        $checkStmt = $conn->prepare("SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?");
        $checkStmt->bind_param("i", $data['id']);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        $checkData = $checkResult->fetch_assoc();
        $checkStmt->close();
        
        if ($checkData['count'] > 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'Cannot delete event with existing registrations. Delete registrations first.'
            ]);
            exit;
        }
        
        $stmt = $conn->prepare("DELETE FROM events WHERE id = ?");
        $stmt->bind_param("i", $data['id']);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Event deleted successfully'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete event']);
        }
        
        $stmt->close();
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

$conn->close();
?>