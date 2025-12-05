<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../includes/config.php';
require_once '../includes/db.php';
require_once '../includes/mail.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

// Validate required fields
$required = ['name', 'email', 'subject', 'message'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        echo json_encode(['success' => false, 'message' => "$field is required"]);
        exit;
    }
}

// Validate email
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

$db = Database::getInstance();
$conn = $db->getConnection();

// Save contact message to database
$stmt = $conn->prepare("
    INSERT INTO contact_messages (name, email, subject, message) 
    VALUES (?, ?, ?, ?)
");

$stmt->bind_param(
    "ssss",
    $data['name'],
    $data['email'],
    $data['subject'],
    $data['message']
);

if ($stmt->execute()) {
    $message_id = $stmt->insert_id;
    
    // Send email notification to admin
    $admin_email = 'admin@aesthetebookcafe.com'; // Change this to actual admin email
    $admin_subject = "New Contact Message: {$data['subject']}";
    
    $admin_message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #9C6B46; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .message-box { background: white; padding: 20px; border-left: 4px solid #9C6B46; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>New Contact Message</h2>
            </div>
            <div class='content'>
                <h3>Message Details</h3>
                <p><strong>From:</strong> {$data['name']} &lt;{$data['email']}&gt;</p>
                <p><strong>Subject:</strong> {$data['subject']}</p>
                <p><strong>Phone:</strong> " . ($data['phone'] ?? 'Not provided') . "</p>
                <p><strong>Message ID:</strong> #{$message_id}</p>
                
                <div class='message-box'>
                    <h4>Message:</h4>
                    <p>" . nl2br(htmlspecialchars($data['message'])) . "</p>
                </div>
                
                <p>You can view this message in the admin panel.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    // Send to admin
    $admin_headers = "MIME-Version: 1.0" . "\r\n";
    $admin_headers .= "Content-type: text/html; charset=UTF-8" . "\r\n";
    $admin_headers .= "From: " . SMTP_FROM_NAME . " <" . SMTP_FROM_EMAIL . ">" . "\r\n";
    
    $admin_email_sent = mail($admin_email, $admin_subject, $admin_message, $admin_headers);
    
    // Send auto-reply to user
    $user_subject = "Thank you for contacting Aesthete Book Cafe";
    
    $user_message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #7E5634; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>Aesthete Book Cafe</h2>
                <h3>Where Books Meet The Soul</h3>
            </div>
            <div class='content'>
                <h3>Thank you for your message, {$data['name']}!</h3>
                <p>We have received your inquiry and our team will get back to you within 24-48 hours.</p>
                
                <div style='background: white; padding: 20px; border-radius: 4px; margin: 20px 0;'>
                    <p><strong>Reference:</strong> #{$message_id}</p>
                    <p><strong>Subject:</strong> {$data['subject']}</p>
                    <p><strong>Submitted:</strong> " . date('F j, Y \a\t g:i A') . "</p>
                </div>
                
                <p>In the meantime, feel free to:</p>
                <ul>
                    <li>Browse our <a href='" . SITE_URL . "books.html'>book collection</a></li>
                    <li>Check out <a href='" . SITE_URL . "events.html'>upcoming events</a></li>
                    <li>Visit our cafe during opening hours</li>
                </ul>
                
                <p>Best regards,<br>The Aesthete Book Cafe Team</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $user_headers = "MIME-Version: 1.0" . "\r\n";
    $user_headers .= "Content-type: text/html; charset=UTF-8" . "\r\n";
    $user_headers .= "From: " . SMTP_FROM_NAME . " <" . SMTP_FROM_EMAIL . ">" . "\r\n";
    
    $user_email_sent = mail($data['email'], $user_subject, $user_message, $user_headers);
    
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your message! We\'ll get back to you soon.',
        'message_id' => $message_id,
        'admin_email_sent' => $admin_email_sent,
        'user_email_sent' => $user_email_sent
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to send message. Please try again.']);
}

$stmt->close();
$conn->close();
?>