<?php
require_once 'config.php';

class Mailer {
    public static function sendVerificationEmail($email, $username, $token) {
        $verificationLink = SITE_URL . "api/auth/verify-email.php?token=" . $token;
        
        $subject = "Verify Your Email - Aesthete Book Cafe";
        $message = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #9C6B46; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background-color: #f9f9f9; }
                .button { 
                    background-color: #9C6B46; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 4px; 
                    display: inline-block;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Aesthete Book Cafe</h1>
                    <h3>Where Books Meet The Soul</h3>
                </div>
                <div class='content'>
                    <h2>Welcome, $username!</h2>
                    <p>Thank you for registering with Aesthete Book Cafe.</p>
                    <p>Please verify your email address by clicking the button below:</p>
                    <a href='$verificationLink' class='button'>Verify Email Address</a>
                    <p>Or copy and paste this link in your browser:</p>
                    <p><small>$verificationLink</small></p>
                    <p>If you didn't create an account, please ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        return self::sendEmail($email, $subject, $message);
    }
    
    public static function sendEventRegistration($email, $eventTitle, $eventDate, $eventTime) {
        $subject = "Event Registration Confirmation - Aesthete Book Cafe";
        $message = "
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
                    <h2>Event Registration Confirmed!</h2>
                </div>
                <div class='content'>
                    <h3>You're registered for: $eventTitle</h3>
                    <p><strong>Date:</strong> $eventDate</p>
                    <p><strong>Time:</strong> $eventTime</p>
                    <p>We look forward to seeing you at the event!</p>
                    <p>Best regards,<br>The Aesthete Book Cafe Team</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        return self::sendEmail($email, $subject, $message);
    }
    
    private static function sendEmail($to, $subject, $body) {
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8" . "\r\n";
        $headers .= "From: " . SMTP_FROM_NAME . " <" . SMTP_FROM_EMAIL . ">" . "\r\n";
        
        // Using mail() function with Mailtrap
        ini_set("SMTP", SMTP_HOST);
        ini_set("smtp_port", SMTP_PORT);
        ini_set("sendmail_from", SMTP_FROM_EMAIL);
        
        return mail($to, $subject, $body, $headers);
    }
}
    public static function sendContactNotification($adminEmail, $contactData, $messageId) {
    $subject = "New Contact Message: " . $contactData['subject'];
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #9C6B46; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .message-box { background: white; padding: 20px; border-left: 4px solid #9C6B46; margin: 20px 0; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #4B3A33; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>New Contact Message</h2>
                <p>Aesthete Book Cafe</p>
            </div>
            <div class='content'>
                <h3>Message Details</h3>
                
                <div class='info-item'>
                    <span class='label'>Message ID:</span> #{$messageId}
                </div>
                <div class='info-item'>
                    <span class='label'>From:</span> {$contactData['name']} &lt;{$contactData['email']}&gt;
                </div>
                <div class='info-item'>
                    <span class='label'>Subject:</span> {$contactData['subject']}
                </div>
                <div class='info-item'>
                    <span class='label'>Phone:</span> " . ($contactData['phone'] ?? 'Not provided') . "
                </div>
                <div class='info-item'>
                    <span class='label'>Date:</span> " . date('F j, Y \a\t g:i A') . "
                </div>
                
                <div class='message-box'>
                    <h4>Message Content:</h4>
                    <p>" . nl2br(htmlspecialchars($contactData['message'])) . "</p>
                </div>
                
                <p style='margin-top: 30px;'>
                    <a href='" . SITE_URL . "admin/manage-messages.html' style='
                        background: #9C6B46;
                        color: white;
                        padding: 10px 20px;
                        text-decoration: none;
                        border-radius: 4px;
                        display: inline-block;
                    '>View in Admin Panel</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    return self::sendEmail($adminEmail, $subject, $message);
}

public static function sendContactAutoReply($userEmail, $userName, $messageId, $subject) {
    $subject = "Thank you for contacting Aesthete Book Cafe";
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #7E5634; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .info-box { background: white; padding: 20px; border-radius: 4px; margin: 20px 0; border: 1px solid #E8E2DB; }
            .cta-button { 
                background-color: #9C6B46; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 4px; 
                display: inline-block;
                margin: 10px 5px;
            }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>Aesthete Book Cafe</h1>
                <h3>Where Books Meet The Soul</h3>
            </div>
            <div class='content'>
                <h2>Thank you for your message, {$userName}!</h2>
                <p>We have received your inquiry and our team will get back to you within 24-48 hours.</p>
                
                <div class='info-box'>
                    <h3>Message Reference</h3>
                    <p><strong>Reference #:</strong> {$messageId}</p>
                    <p><strong>Subject:</strong> {$subject}</p>
                    <p><strong>Submitted:</strong> " . date('F j, Y \a\t g:i A') . "</p>
                </div>
                
                <p>While you wait, why not:</p>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='" . SITE_URL . "books.html' class='cta-button'>
                        <i class='fas fa-book'></i> Browse Books
                    </a>
                    <a href='" . SITE_URL . "events.html' class='cta-button'>
                        <i class='fas fa-calendar'></i> View Events
                    </a>
                    <a href='" . SITE_URL . "menu.html' class='cta-button'>
                        <i class='fas fa-coffee'></i> See Our Menu
                    </a>
                </div>
                
                <p><strong>Business Hours:</strong><br>
                Monday-Friday: 8:00 AM - 10:00 PM<br>
                Saturday: 9:00 AM - 11:00 PM<br>
                Sunday: 9:00 AM - 9:00 PM</p>
                
                <p><strong>Location:</strong><br>
                123 Book Street, Reading City, RC 10001</p>
                
                <p>Best regards,<br>
                <strong>The Aesthete Book Cafe Team</strong></p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    return self::sendEmail($userEmail, $subject, $message);
}
// Add to existing mail.php

public static function sendWelcomeEmail($email, $username) {
    $subject = "Welcome to Aesthete Book Cafe!";
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #9C6B46; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .feature { display: flex; align-items: center; gap: 15px; margin: 20px 0; }
            .feature-icon { width: 40px; height: 40px; background: #9C6B46; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>Aesthete Book Cafe</h1>
                <h3>Where Books Meet The Soul</h3>
            </div>
            <div class='content'>
                <h2>Welcome aboard, $username!</h2>
                <p>Your account has been created by our administrator. You can now login and start exploring everything our book cafe has to offer.</p>
                
                <div class='feature'>
                    <div class='feature-icon'>
                        <i class='fas fa-book'></i>
                    </div>
                    <div>
                        <h4>Browse Our Collection</h4>
                        <p>Discover carefully curated books across various genres.</p>
                    </div>
                </div>
                
                <div class='feature'>
                    <div class='feature-icon'>
                        <i class='fas fa-calendar'></i>
                    </div>
                    <div>
                        <h4>Join Events</h4>
                        <p>Participate in book clubs, author meetups, and literary events.</p>
                    </div>
                </div>
                
                <div class='feature'>
                    <div class='feature-icon'>
                        <i class='fas fa-coffee'></i>
                    </div>
                    <div>
                        <h4>Enjoy Our Menu</h4>
                        <p>Order from our artisanal coffee and pastry selection.</p>
                    </div>
                </div>
                
                <p style='margin-top: 30px;'>
                    <a href='" . SITE_URL . "login.html' style='
                        background: #9C6B46;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 4px;
                        display: inline-block;
                    '>Login to Your Account</a>
                </p>
                
                <p style='margin-top: 30px; color: #666; font-size: 0.9rem;'>
                    If you have any questions, feel free to reply to this email or contact us at info@aesthetebookcafe.com
                </p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    return self::sendEmail($email, $subject, $message);
}

public static function sendResetPasswordEmail($email, $username, $resetToken) {
    $resetLink = SITE_URL . "reset-password.html?token=" . $resetToken;
    
    $subject = "Password Reset Request - Aesthete Book Cafe";
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #7E5634; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .warning { background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>Password Reset Request</h2>
            </div>
            <div class='content'>
                <h3>Hello $username,</h3>
                <p>We received a request to reset your password for your Aesthete Book Cafe account.</p>
                
                <div class='warning'>
                    <p><strong>Important:</strong> This password reset link will expire in 24 hours.</p>
                </div>
                
                <p>To reset your password, click the button below:</p>
                
                <p style='text-align: center; margin: 30px 0;'>
                    <a href='$resetLink' style='
                        background: #7E5634;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 4px;
                        display: inline-block;
                    '>Reset Your Password</a>
                </p>
                
                <p>Or copy and paste this link in your browser:</p>
                <p style='background: white; padding: 15px; border-radius: 4px; word-break: break-all;'>
                    <small>$resetLink</small>
                </p>
                
                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                
                <p style='margin-top: 30px; color: #666; font-size: 0.9rem;'>
                    For security reasons, this link will expire in 24 hours.
                </p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    return self::sendEmail($email, $subject, $message);
}
?>