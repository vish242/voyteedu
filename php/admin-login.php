<?php
require_once 'config.php';

// Check if admin is already logged in
if (is_logged_in() && $_SESSION['user_type'] === 'admin') {
    redirect('../admin-dashboard.html');
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = sanitize_input($_POST['admin_username'] ?? '');
    $password = $_POST['admin_password'] ?? '';
    
    // Validate input
    if (empty($username) || empty($password)) {
        json_response(['error' => 'Username and password are required'], 400);
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
    $stmt->execute([$username, $ip_address]);
    $attempts = $stmt->fetch()['attempts'];
    
    if ($attempts >= MAX_LOGIN_ATTEMPTS) {
        // Log failed attempt
        $stmt = $pdo->prepare("
            INSERT INTO login_attempts (identifier, ip_address, success) 
            VALUES (?, ?, FALSE)
        ");
        $stmt->execute([$username, $ip_address]);
        
        json_response(['error' => 'Too many login attempts. Please try again in 15 minutes.'], 429);
    }
    
    try {
        // Find administrator
        $stmt = $pdo->prepare("
            SELECT id, username, email, password_hash, first_name, last_name, 
                   role, is_active 
            FROM administrators 
            WHERE username = ? AND is_active = TRUE
        ");
        $stmt->execute([$username]);
        $admin = $stmt->fetch();
        
        if (!$admin || !password_verify($password, $admin['password_hash'])) {
            // Log failed attempt
            $stmt = $pdo->prepare("
                INSERT INTO login_attempts (identifier, ip_address, success) 
                VALUES (?, ?, FALSE)
            ");
            $stmt->execute([$username, $ip_address]);
            
            json_response(['error' => 'Invalid username or password'], 401);
        }
        
        // Successful login
        $_SESSION['user_id'] = $admin['id'];
        $_SESSION['user_type'] = 'admin';
        $_SESSION['admin_username'] = $admin['username'];
        $_SESSION['user_name'] = $admin['first_name'] . ' ' . $admin['last_name'];
        $_SESSION['user_email'] = $admin['email'];
        $_SESSION['admin_role'] = $admin['role'];
        $_SESSION['last_activity'] = time();
        
        // Update last login
        $stmt = $pdo->prepare("UPDATE administrators SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$admin['id']]);
        
        // Log successful attempt
        $stmt = $pdo->prepare("
            INSERT INTO login_attempts (identifier, ip_address, success) 
            VALUES (?, ?, TRUE)
        ");
        $stmt->execute([$username, $ip_address]);
        
        // Log activity
        log_activity($admin['id'], 'admin_login', 'Administrator login successful');
        
        json_response([
            'success' => true,
            'message' => 'Login successful',
            'redirect' => '../admin-dashboard.html'
        ]);
        
    } catch (PDOException $e) {
        error_log("Admin login error: " . $e->getMessage());
        json_response(['error' => 'An error occurred during login. Please try again.'], 500);
    }
}

// If not POST request, redirect to admin login page
redirect('../admin-login.html');
?>