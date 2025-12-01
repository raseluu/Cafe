<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../models/User.php';

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Logout user
$user = new User();
$result = $user->logout();

echo json_encode($result);
?>