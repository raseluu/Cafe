<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../models/User.php';

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
if (User::isLoggedIn()) {
    $user = new User();
    $userData = $user->getUserById($_SESSION['user_id']);
    
    echo json_encode([
        'loggedIn' => true,
        'user' => $userData
    ]);
} else {
    echo json_encode([
        'loggedIn' => false,
        'message' => 'Not authenticated'
    ]);
}
?>