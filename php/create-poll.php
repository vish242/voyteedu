<?php
require_once 'config.php';

// Check if user is admin
if (!is_logged_in() || !is_admin()) {
    json_response(['error' => 'Unauthorized access'], 403);
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = sanitize_input($_POST['title'] ?? '');
    $description = sanitize_input($_POST['description'] ?? '');
    $category = sanitize_input($_POST['category'] ?? '');
    $options = $_POST['options'] ?? [];
    $start_date = $_POST['start_date'] ?? '';
    $end_date = $_POST['end_date'] ?? '';
    $allow_comments = isset($_POST['allow_comments']);
    
    // Validate input
    $errors = [];
    
    if (empty($title)) {
        $errors[] = 'Poll title is required';
    }
    
    if (empty($category)) {
        $errors[] = 'Poll category is required';
    }
    
    if (empty($start_date) || empty($end_date)) {
        $errors[] = 'Start and end dates are required';
    }
    
    if (strtotime($start_date) >= strtotime($end_date)) {
        $errors[] = 'End date must be after start date';
    }
    
    if (strtotime($end_date) > strtotime('+' . MAX_POLL_DURATION_DAYS . ' days')) {
        $errors[] = 'Poll duration cannot exceed ' . MAX_POLL_DURATION_DAYS . ' days';
    }
    
    // Validate options
    $valid_options = array_filter($options, function($option) {
        return !empty(trim($option));
    });
    
    if (count($valid_options) < MIN_POLL_OPTIONS) {
        $errors[] = 'At least ' . MIN_POLL_OPTIONS . ' options are required';
    }
    
    if (count($valid_options) > MAX_POLL_OPTIONS) {
        $errors[] = 'Maximum ' . MAX_POLL_OPTIONS . ' options allowed';
    }
    
    if (!empty($errors)) {
        json_response(['error' => implode(', ', $errors)], 400);
    }
    
    try {
        // Start transaction
        $pdo->beginTransaction();
        
        // Get category ID
        $stmt = $pdo->prepare("SELECT id FROM poll_categories WHERE slug = ?");
        $stmt->execute([$category]);
        $category_id = $stmt->fetchColumn();
        
        if (!$category_id) {
            throw new Exception('Invalid category');
        }
        
        // Insert poll
        $stmt = $pdo->prepare("
            INSERT INTO polls (title, description, category_id, created_by, status, 
                             start_date, end_date, allow_comments) 
            VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
        ");
        
        $stmt->execute([
            $title,
            $description,
            $category_id,
            $_SESSION['user_id'],
            $start_date,
            $end_date,
            $allow_comments ? 1 : 0
        ]);
        
        $poll_id = $pdo->lastInsertId();
        
        // Insert poll options
        $stmt = $pdo->prepare("
            INSERT INTO poll_options (poll_id, option_text, option_order) 
            VALUES (?, ?, ?)
        ");
        
        foreach ($valid_options as $index => $option) {
            $stmt->execute([$poll_id, trim($option), $index + 1]);
        }
        
        // Commit transaction
        $pdo->commit();
        
        // Log activity
        log_activity($_SESSION['user_id'], 'poll_created', "Poll ID: $poll_id, Title: $title");
        
        json_response([
            'success' => true,
            'message' => 'Poll created successfully',
            'poll_id' => $poll_id
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction
        $pdo->rollback();
        
        error_log("Create poll error: " . $e->getMessage());
        json_response(['error' => 'Failed to create poll. Please try again.'], 500);
    }
}

// If not POST request, return error
json_response(['error' => 'Invalid request method'], 405);
?>