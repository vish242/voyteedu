-- VoteEdu Database Schema
-- This file contains the complete database structure for the voting system

CREATE DATABASE IF NOT EXISTS voting_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE voting_system;

-- Students table
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    class VARCHAR(100),
    department VARCHAR(100),
    year_of_study INT,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_student_id (student_id),
    INDEX idx_email (email),
    INDEX idx_active (is_active)
);

-- Administrators table
CREATE TABLE administrators (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'super_admin') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_active (is_active)
);

-- Poll categories table
CREATE TABLE poll_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
);

-- Polls table
CREATE TABLE polls (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT,
    created_by INT NOT NULL,
    status ENUM('draft', 'active', 'closed', 'cancelled') DEFAULT 'draft',
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    allow_comments BOOLEAN DEFAULT TRUE,
    allow_multiple_votes BOOLEAN DEFAULT FALSE,
    is_anonymous BOOLEAN DEFAULT TRUE,
    max_votes_per_user INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES poll_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES administrators(id) ON DELETE CASCADE,
    
    INDEX idx_status (status),
    INDEX idx_category (category_id),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_created_by (created_by)
);

-- Poll options table
CREATE TABLE poll_options (
    id INT PRIMARY KEY AUTO_INCREMENT,
    poll_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    option_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    
    INDEX idx_poll_id (poll_id),
    INDEX idx_order (poll_id, option_order)
);

-- Votes table
CREATE TABLE votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    poll_id INT NOT NULL,
    option_id INT NOT NULL,
    student_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_vote (poll_id, student_id),
    INDEX idx_poll_id (poll_id),
    INDEX idx_option_id (option_id),
    INDEX idx_student_id (student_id),
    INDEX idx_created_at (created_at)
);

-- Vote comments table
CREATE TABLE vote_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vote_id INT NOT NULL,
    comment TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE,
    
    INDEX idx_vote_id (vote_id)
);

-- Activity logs table
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    user_type ENUM('student', 'admin') NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id, user_type),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Login attempts table (for security)
CREATE TABLE login_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    identifier VARCHAR(255) NOT NULL, -- email, student_id, or username
    ip_address VARCHAR(45) NOT NULL,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT FALSE,
    
    INDEX idx_identifier (identifier),
    INDEX idx_ip_address (ip_address),
    INDEX idx_attempt_time (attempt_time)
);

-- System settings table
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (setting_key),
    INDEX idx_public (is_public)
);

-- Insert default poll categories
INSERT INTO poll_categories (name, slug, description, color) VALUES
('Class Schedule', 'class_schedule', 'Polls related to class scheduling, cancellations, and timing', '#3B82F6'),
('Lecture Feedback', 'lecture_feedback', 'Feedback and ratings for lectures and teaching quality', '#8B5CF6'),
('Campus Facilities', 'campus_facilities', 'Polls about campus facilities, library, cafeteria, etc.', '#10B981'),
('Student Services', 'student_services', 'Polls related to student services and support', '#F59E0B'),
('General Opinion', 'general_opinion', 'General opinion polls and surveys', '#EF4444');

-- Insert default admin user (password: admin123)
INSERT INTO administrators (username, email, password_hash, first_name, last_name, role) VALUES
('admin', 'admin@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System', 'Administrator', 'super_admin');

-- Insert sample students (password: student123 for all)
INSERT INTO students (student_id, email, password_hash, first_name, last_name, class, department, year_of_study) VALUES
('STU001', 'john.doe@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe', 'CS-2024', 'Computer Science', 3),
('STU002', 'jane.smith@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Smith', 'EE-2024', 'Electrical Engineering', 2),
('STU003', 'mike.johnson@university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike', 'Johnson', 'ME-2025', 'Mechanical Engineering', 1);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', 'VoteEdu', 'string', 'Name of the voting system', TRUE),
('site_description', 'Student Voting System for Educational Decisions', 'string', 'Description of the voting system', TRUE),
('max_poll_duration', '30', 'integer', 'Maximum poll duration in days', FALSE),
('allow_anonymous_voting', '1', 'boolean', 'Allow anonymous voting', FALSE),
('require_email_verification', '0', 'boolean', 'Require email verification for new accounts', FALSE),
('maintenance_mode', '0', 'boolean', 'Enable maintenance mode', FALSE);

-- Create views for easier data access

-- View for poll statistics
CREATE VIEW poll_stats AS
SELECT 
    p.id,
    p.title,
    p.status,
    p.start_date,
    p.end_date,
    pc.name as category_name,
    COUNT(DISTINCT v.id) as total_votes,
    COUNT(DISTINCT po.id) as total_options,
    CONCAT(a.first_name, ' ', a.last_name) as created_by_name
FROM polls p
LEFT JOIN poll_categories pc ON p.category_id = pc.id
LEFT JOIN votes v ON p.id = v.poll_id
LEFT JOIN poll_options po ON p.id = po.poll_id
LEFT JOIN administrators a ON p.created_by = a.id
GROUP BY p.id, p.title, p.status, p.start_date, p.end_date, pc.name, a.first_name, a.last_name;

-- View for student participation
CREATE VIEW student_participation AS
SELECT 
    s.id,
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) as full_name,
    s.class,
    s.department,
    COUNT(v.id) as total_votes,
    COUNT(DISTINCT v.poll_id) as polls_participated,
    MAX(v.created_at) as last_vote_date
FROM students s
LEFT JOIN votes v ON s.id = v.student_id
GROUP BY s.id, s.student_id, s.first_name, s.last_name, s.class, s.department;

-- View for poll results
CREATE VIEW poll_results AS
SELECT 
    p.id as poll_id,
    p.title as poll_title,
    po.id as option_id,
    po.option_text,
    COUNT(v.id) as vote_count,
    ROUND((COUNT(v.id) * 100.0 / NULLIF(total_votes.total, 0)), 2) as percentage
FROM polls p
JOIN poll_options po ON p.id = po.poll_id
LEFT JOIN votes v ON po.id = v.option_id
JOIN (
    SELECT poll_id, COUNT(*) as total
    FROM votes
    GROUP BY poll_id
) total_votes ON p.id = total_votes.poll_id
GROUP BY p.id, p.title, po.id, po.option_text, total_votes.total
ORDER BY p.id, po.option_order;

-- Triggers for automatic updates

-- Update poll status based on dates
DELIMITER //
CREATE TRIGGER update_poll_status
BEFORE UPDATE ON polls
FOR EACH ROW
BEGIN
    IF NEW.start_date <= NOW() AND NEW.end_date > NOW() AND NEW.status = 'draft' THEN
        SET NEW.status = 'active';
    ELSEIF NEW.end_date <= NOW() AND NEW.status = 'active' THEN
        SET NEW.status = 'closed';
    END IF;
END//
DELIMITER ;

-- Log vote activity
DELIMITER //
CREATE TRIGGER log_vote_activity
AFTER INSERT ON votes
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (user_id, user_type, action, details, created_at)
    VALUES (NEW.student_id, 'student', 'vote_cast', CONCAT('Poll ID: ', NEW.poll_id, ', Option ID: ', NEW.option_id), NOW());
END//
DELIMITER ;

-- Indexes for performance optimization
CREATE INDEX idx_polls_active ON polls (status, start_date, end_date);
CREATE INDEX idx_votes_poll_date ON votes (poll_id, created_at);
CREATE INDEX idx_activity_logs_date ON activity_logs (created_at);
CREATE INDEX idx_login_attempts_cleanup ON login_attempts (attempt_time);

-- Create stored procedures for common operations

-- Procedure to get poll results
DELIMITER //
CREATE PROCEDURE GetPollResults(IN poll_id INT)
BEGIN
    SELECT 
        po.id as option_id,
        po.option_text,
        COUNT(v.id) as vote_count,
        ROUND((COUNT(v.id) * 100.0 / NULLIF(total_votes.total, 0)), 2) as percentage
    FROM poll_options po
    LEFT JOIN votes v ON po.id = v.option_id
    JOIN (
        SELECT COUNT(*) as total
        FROM votes
        WHERE poll_id = poll_id
    ) total_votes
    WHERE po.poll_id = poll_id
    GROUP BY po.id, po.option_text, total_votes.total
    ORDER BY po.option_order;
END//
DELIMITER ;

-- Procedure to clean up old login attempts
DELIMITER //
CREATE PROCEDURE CleanupLoginAttempts()
BEGIN
    DELETE FROM login_attempts 
    WHERE attempt_time < DATE_SUB(NOW(), INTERVAL 24 HOUR);
END//
DELIMITER ;

-- Create events for automatic maintenance

-- Event to close expired polls
CREATE EVENT IF NOT EXISTS close_expired_polls
ON SCHEDULE EVERY 1 HOUR
DO
UPDATE polls 
SET status = 'closed' 
WHERE status = 'active' AND end_date <= NOW();

-- Event to clean up old login attempts
CREATE EVENT IF NOT EXISTS cleanup_login_attempts
ON SCHEDULE EVERY 1 DAY
DO
CALL CleanupLoginAttempts();

-- Grant appropriate permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON voting_system.* TO 'voting_user'@'localhost';
-- FLUSH PRIVILEGES;