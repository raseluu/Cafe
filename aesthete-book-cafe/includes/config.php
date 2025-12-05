<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'aesthete_book_cafe');
define('DB_USER', 'root');
define('DB_PASS', ''); // XAMPP default is empty

// Mailtrap SMTP configuration
define('SMTP_HOST', 'sandbox.smtp.mailtrap.io');
define('SMTP_PORT', 587);
define('SMTP_USER', '16386386f2a8c8');
define('SMTP_PASS', '614e9b493a2118');
define('SMTP_FROM_EMAIL', 'noreply@aesthetebookcafe.com');
define('SMTP_FROM_NAME', 'Aesthete Book Cafe');

// Site configuration
define('SITE_URL', 'http://localhost/aesthete-book-cafe/');
define('UPLOAD_PATH', $_SERVER['DOCUMENT_ROOT'] . '/aesthete-book-cafe/uploads/');

// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
?>