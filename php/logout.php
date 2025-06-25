<?php
require_once 'config.php';

// Log the logout activity if user is logged in
if (is_logged_in()) {
    $user_type = $_SESSION['user_type'];
    $user_id = $_SESSION['user_id'];
    
    log_activity($user_id, $user_type . '_logout', 'User logged out');
}

// Clear remember me cookie if it exists
if (isset($_COOKIE['remember_token'])) {
    setcookie('remember_token', '', time() - 3600, '/', '', true, true);
    
    // Remove token from database if you have a remember_tokens table
    // This would require additional implementation
}

// Destroy session
session_destroy();

// Redirect to home page
redirect('../index.html');
?>