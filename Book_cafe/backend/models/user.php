<?php
require_once __DIR__ . '/../config/database.php';

class User {
    private $db;
    
    public function __construct() {
        $this->db = getDB();
    }
    
    // Register new user
    public function register($name, $email, $phone, $password) {
        try {
            // Check if email already exists
            $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            
            if ($stmt->rowCount() > 0) {
                return ['success' => false, 'message' => 'Email already registered'];
            }
            
            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            
            // Insert user
            $stmt = $this->db->prepare(
                "INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)"
            );
            $stmt->execute([$name, $email, $phone, $hashedPassword]);
            
            return [
                'success' => true, 
                'message' => 'Registration successful! You can now login.',
                'user_id' => $this->db->lastInsertId()
            ];
            
        } catch(PDOException $e) {
            return ['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()];
        }
    }
    
    // Login user
    public function login($email, $password) {
        try {
            $stmt = $this->db->prepare(
                "SELECT id, name, email, phone, password, role, status FROM users WHERE email = ?"
            );
            $stmt->execute([$email]);
            
            if ($stmt->rowCount() === 0) {
                return ['success' => false, 'message' => 'Invalid email or password'];
            }
            
            $user = $stmt->fetch();
            
            // Check if account is active
            if ($user['status'] !== 'active') {
                return ['success' => false, 'message' => 'Your account has been deactivated'];
            }
            
            // Verify password
            if (!password_verify($password, $user['password'])) {
                return ['success' => false, 'message' => 'Invalid email or password'];
            }
            
            // Remove password from user data
            unset($user['password']);
            
            // Start session
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['logged_in'] = true;
            
            // Create session record
            $this->createSession($user['id']);
            
            return [
                'success' => true, 
                'message' => 'Login successful!',
                'user' => $user
            ];
            
        } catch(PDOException $e) {
            return ['success' => false, 'message' => 'Login failed: ' . $e->getMessage()];
        }
    }
    
    // Create session record
    private function createSession($userId) {
        $sessionId = session_id();
        $ipAddress = $_SERVER['REMOTE_ADDR'];
        $userAgent = $_SERVER['HTTP_USER_AGENT'];
        
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO sessions (id, user_id, ip_address, user_agent) 
                VALUES (?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE last_activity = CURRENT_TIMESTAMP"
            );
            $stmt->execute([$sessionId, $userId, $ipAddress, $userAgent]);
        } catch(PDOException $e) {
            // Log error but don't stop execution
            error_log("Session creation failed: " . $e->getMessage());
        }
    }
    
    // Logout user
    public function logout() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Delete session from database
        if (isset($_SESSION['user_id'])) {
            $sessionId = session_id();
            try {
                $stmt = $this->db->prepare("DELETE FROM sessions WHERE id = ?");
                $stmt->execute([$sessionId]);
            } catch(PDOException $e) {
                error_log("Session deletion failed: " . $e->getMessage());
            }
        }
        
        // Destroy session
        $_SESSION = [];
        session_destroy();
        
        return ['success' => true, 'message' => 'Logged out successfully'];
    }
    
    // Get user by ID
    public function getUserById($userId) {
        try {
            $stmt = $this->db->prepare(
                "SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?"
            );
            $stmt->execute([$userId]);
            return $stmt->fetch();
        } catch(PDOException $e) {
            return null;
        }
    }
    
    // Get user by email
    public function getUserByEmail($email) {
        try {
            $stmt = $this->db->prepare(
                "SELECT id, name, email, phone, role, status, created_at FROM users WHERE email = ?"
            );
            $stmt->execute([$email]);
            return $stmt->fetch();
        } catch(PDOException $e) {
            return null;
        }
    }
    
    // Update user profile
    public function updateProfile($userId, $name, $phone) {
        try {
            $stmt = $this->db->prepare(
                "UPDATE users SET name = ?, phone = ? WHERE id = ?"
            );
            $stmt->execute([$name, $phone, $userId]);
            
            return ['success' => true, 'message' => 'Profile updated successfully'];
        } catch(PDOException $e) {
            return ['success' => false, 'message' => 'Update failed: ' . $e->getMessage()];
        }
    }
    
    // Change password
    public function changePassword($userId, $currentPassword, $newPassword) {
        try {
            // Verify current password
            $stmt = $this->db->prepare("SELECT password FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            if (!password_verify($currentPassword, $user['password'])) {
                return ['success' => false, 'message' => 'Current password is incorrect'];
            }
            
            // Update password
            $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
            $stmt = $this->db->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->execute([$hashedPassword, $userId]);
            
            return ['success' => true, 'message' => 'Password changed successfully'];
        } catch(PDOException $e) {
            return ['success' => false, 'message' => 'Password change failed: ' . $e->getMessage()];
        }
    }
    
    // Check if user is logged in
    public static function isLoggedIn() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
    }
    
    // Check if user is admin
    public static function isAdmin() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
    }
}
?>