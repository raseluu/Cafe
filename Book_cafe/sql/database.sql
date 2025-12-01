-- Create Database
CREATE DATABASE IF NOT EXISTS aesthete_cafe;
USE aesthete_cafe;

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events Table
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time VARCHAR(50),
    location VARCHAR(150),
    seats_available INT DEFAULT 30,
    icon VARCHAR(50),
    image VARCHAR(255),
    status ENUM('active', 'cancelled', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_date (event_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event Registrations Table
CREATE TABLE event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    event_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    guests INT DEFAULT 1,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event_id (event_id),
    INDEX idx_user_id (user_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact Messages Table
CREATE TABLE contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions Table (for secure session management)
CREATE TABLE sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Admin User
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (name, email, phone, password, role) VALUES 
('Admin', 'admin@aesthetebookcafe.com', '+1234567890', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert Sample Events
INSERT INTO events (title, description, event_date, event_time, location, seats_available, icon) VALUES
('Poetry Night: Verses & Voices', 'Join us for an enchanting evening of soul-stirring poetry with local and visiting artists.', '2025-01-15', '7:00 PM - 9:00 PM', 'Main Hall', 30, 'fa-feather-alt'),
('Book Club: The Midnight Library', 'Dive deep into Matt Haig\'s "The Midnight Library" with fellow book lovers.', '2025-01-22', '6:00 PM - 8:00 PM', 'Reading Room', 20, 'fa-book-reader'),
('Coffee & Canvas Workshop', 'Unleash your creativity in this painting workshop! All materials provided.', '2025-02-05', '3:00 PM - 6:00 PM', 'Art Corner', 15, 'fa-palette'),
('Author Meet & Greet', 'Meet bestselling author Sarah Mitchell. Book signing and Q&A included.', '2025-02-12', '5:00 PM - 7:00 PM', 'Main Hall', 40, 'fa-user-tie'),
('Creative Writing Workshop', 'Learn the craft of storytelling from published authors.', '2025-02-19', '10:00 AM - 1:00 PM', 'Writing Nook', 12, 'fa-pen-fancy'),
('Live Music & Open Mic Night', 'Enjoy live acoustic performances and open mic session.', '2025-02-28', '8:00 PM - 10:30 PM', 'Main Hall', 50, 'fa-music');