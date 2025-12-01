<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../models/User.php';

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
$requiredFields = ['name', 'email', 'phone', 'password', 'confirmPassword'];
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
$password = $data['password'];
$confirmPassword = $data['confirmPassword'];

// Validation
$errors = [];

// Name validation
if (strlen($name) < 3) {
    $errors[] = 'Name must be at least 3 characters';
}

// Email validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email address';
}

// Phone validation
if (!preg_match('/^[\d\s\-\+\(\)]+$/', $phone)) {
    $errors[] = 'Invalid phone number';
}

// Password validation
if (strlen($password) < 8) {
    $errors[] = 'Password must be at least 8 characters';
}

// Password confirmation
if ($password !== $confirmPassword) {
    $errors[] = 'Passwords do not match';
}

// If there are validation errors
if (!empty($errors)) {
    echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
    exit;
}

// Register user
$user = new User();
$result = $user->register($name, $email, $phone, $password);

echo json_encode($result);
?>