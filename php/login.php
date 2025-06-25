<?php
require_once 'config.php';

// Check if user is already logged in
if (is_logged_in() && $_SESSION['user_type'] === 'student') {
    redirect('../dashboard.html');
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $student_id = sanitize_input($_POST['student_id'] ?? '');
    $password = $_POST['password'] ?? '';
    $remember = isset($_POST['remember']);
    
    // Validate input
    if (empty($student_id) || empty($password)) {
        json_response(['error' => 'Student ID and password are required'], 400);
    }
    
    // Check for too many login attempts
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as attempts 
        FROM login_attempts 
        WHERE (identifier = ? OR ip_address = ?) 
        AND attempt_time > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        AND success = FALSE
    ");
    $stmt->execute([$student_id, $ip_address]);
    $attempts = $stmt->fetch()['attempts'];
    
    if ($attempts >= MAX_LOGIN_ATTEMPTS) {
        // Log failed attempt
        $stmt = $pdo->prepare("
            INSERT INTO login_attempts (identifier, ip_address, success) 
            VALUES (?, ?, FALSE)
        ");
        $stmt->execute([$student_id, $ip_address]);
        
        json_response(['error' => 'Too many login attempts. Please try again in 15 minutes.'], 429);
    }
    
    try {
        // Find student
        $stmt = $pdo->prepare("
            SELECT id, student_id, email, password_hash, first_name, last_name, 
                   class, department, is_active 
            FROM students 
            WHERE student_id = ? AND is_active = TRUE
        ");
        $stmt->execute([$student_id]);
        $student = $stmt->fetch();
        
        if (!$student || !password_verify($password, $student['password_hash'])) {
            // Log failed attempt
            $stmt = $pdo->prepare("
                INSERT INTO login_attempts (identifier, ip_address, success) 
                VALUES (?, ?, FALSE)
            ");
            $stmt->execute([$student_id, $ip_address]);
            
            json_response(['error' => 'Invalid student ID or password'], 401);
        }
        
        // Successful login
        $_SESSION['user_id'] = $student['id'];
        $_SESSION['user_type'] = 'student';
        $_SESSION['student_id'] = $student['student_id'];
        $_SESSION['user_name'] = $student['first_name'] . ' ' . $student['last_name'];
        $_SESSION['user_email'] = $student['email'];
        $_SESSION['user_class'] = $student['class'];
        $_SESSION['user_department'] = $student['department'];
        $_SESSION['last_activity'] = time();
        
        // Update last login
        $stmt = $pdo->prepare("UPDATE students SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$student['id']]);
        
        // Log successful attempt
        $stmt = $pdo->prepare("
            INSERT INTO login_attempts (identifier, ip_address, success) 
            VALUES (?, ?, TRUE)
        ");
        $stmt->execute([$student_id, $ip_address]);
        
        // Log activity
        log_activity($student['id'], 'login', 'Student login successful');
        
        // Handle remember me
        if ($remember) {
            $token = bin2hex(random_bytes(32));
            setcookie('remember_token', $token, time() + (30 * 24 * 60 * 60), '/', '', true, true);
            
            // Store token in database (you'd need a remember_tokens table)
            // This is a simplified version
        }
        
        json_response([
            'success' => true,
            'message' => 'Login successful',
            'redirect' => '../dashboard.html'
        ]);
        
    } catch (PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        json_response(['error' => 'An error occurred during login. Please try again.'], 500);
    }
}

// If not POST request, redirect to login page
redirect('../login.html');
?>