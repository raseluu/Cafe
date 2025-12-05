<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../includes/config.php';
require_once '../includes/db.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = Database::getInstance();
$conn = $db->getInstance();

// Get authorization header
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

// In production, verify token here
// For now, we'll accept user_id from GET parameters

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Get user dashboard data
        $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
        
        if (!$user_id) {
            echo json_encode(['success' => false, 'message' => 'User ID required']);
            exit;
        }
        
        // Get user info
        $userStmt = $conn->prepare("SELECT id, username, email, full_name, phone, address, created_at FROM users WHERE id = ?");
        $userStmt->bind_param("i", $user_id);
        $userStmt->execute();
        $userResult = $userStmt->get_result();
        
        if ($userResult->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }
        
        $user = $userResult->fetch_assoc();
        $userStmt->close();
        
        // Get user events count
        $eventsStmt = $conn->prepare("SELECT COUNT(*) as count FROM event_registrations WHERE user_id = ?");
        $eventsStmt->bind_param("i", $user_id);
        $eventsStmt->execute();
        $eventsResult = $eventsStmt->get_result();
        $eventsCount = $eventsResult->fetch_assoc()['count'];
        $eventsStmt->close();
        
        // Get upcoming events
        $upcomingStmt = $conn->prepare("
            SELECT COUNT(*) as count 
            FROM event_registrations er
            JOIN events e ON er.event_id = e.id
            WHERE er.user_id = ? AND e.event_date >= CURDATE()
        ");
        $upcomingStmt->bind_param("i", $user_id);
        $upcomingStmt->execute();
        $upcomingResult = $upcomingStmt->get_result();
        $upcomingCount = $upcomingResult->fetch_assoc()['count'];
        $upcomingStmt->close();
        
        // Get total spent on events
        $spentStmt = $conn->prepare("
            SELECT SUM(e.price) as total 
            FROM event_registrations er
            JOIN events e ON er.event_id = e.id
            WHERE er.user_id = ?
        ");
        $spentStmt->bind_param("i", $user_id);
        $spentStmt->execute();
        $spentResult = $spentStmt->get_result();
        $totalSpent = $spentResult->fetch_assoc()['total'] ?? 0;
        $spentStmt->close();
        
        echo json_encode([
            'success' => true,
            'user' => $user,
            'stats' => [
                'total_events' => $eventsCount,
                'upcoming_events' => $upcomingCount,
                'total_spent' => $totalSpent,
                'member_since' => date('Y', strtotime($user['created_at']))
            ]
        ]);
        break;
        
    case 'PUT':
        // Update user profile
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['id'])) {
            echo json_encode(['success' => false, 'message' => 'User ID required']);
            exit;
        }
        
        // Check if email already exists (if changing email)
        if (!empty($data['email'])) {
            $checkStmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $checkStmt->bind_param("si", $data['email'], $data['id']);
            $checkStmt->execute();
            $checkStmt->store_result();
            
            if ($checkStmt->num_rows > 0) {
                echo json_encode(['success' => false, 'message' => 'Email already in use']);
                exit;
            }
            $checkStmt->close();
        }
        
        // Build update query
        $fields = [];
        $values = [];
        $types = '';
        
        $allowedFields = ['email', 'full_name', 'phone', 'address', 'bio'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
                $types .= 's';
            }
        }
        
        if (empty($fields)) {
            echo json_encode(['success' => false, 'message' => 'No fields to update']);
            exit;
        }
        
        // Add ID at the end
        $values[] = $data['id'];
        $types .= 'i';
        
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$values);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update profile']);
        }
        
        $stmt->close();
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

$conn->close();
?>