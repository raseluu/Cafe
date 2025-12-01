<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/User.php';

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

try {
    $db = getDB();
    $userId = $_SESSION['user_id'];
    
    // Delete user (cascades to sessions and event registrations)
    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    
    // Logout
    $user = new User();
    $user->logout();
    
    echo json_encode([
        'success' => true,
        'message' => 'Your account has been deleted successfully'
    ]);
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Failed to delete account: ' . $e->getMessage()]);
}
?>