<?php
require_once 'config.php';

// Check if user is logged in as student
if (!is_logged_in() || $_SESSION['user_type'] !== 'student') {
    json_response(['error' => 'Unauthorized access'], 403);
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $poll_id = intval($_POST['poll_id'] ?? 0);
    $option_id = intval($_POST['option_id'] ?? 0);
    $comment = sanitize_input($_POST['comment'] ?? '');
    
    // Validate input
    if ($poll_id <= 0 || $option_id <= 0) {
        json_response(['error' => 'Invalid poll or option'], 400);
    }
    
    try {
        // Start transaction
        $pdo->beginTransaction();
        
        // Check if poll exists and is active
        $stmt = $pdo->prepare("
            SELECT id, title, status, start_date, end_date, allow_comments 
            FROM polls 
            WHERE id = ?
        ");
        $stmt->execute([$poll_id]);
        $poll = $stmt->fetch();
        
        if (!$poll) {
            throw new Exception('Poll not found');
        }
        
        if ($poll['status'] !== 'active') {
            throw new Exception('Poll is not active');
        }
        
        $now = date('Y-m-d H:i:s');
        if ($now < $poll['start_date'] || $now > $poll['end_date']) {
            throw new Exception('Poll is not currently accepting votes');
        }
        
        // Check if option belongs to this poll
        $stmt = $pdo->prepare("
            SELECT id FROM poll_options 
            WHERE id = ? AND poll_id = ? AND is_active = TRUE
        ");
        $stmt->execute([$option_id, $poll_id]);
        
        if (!$stmt->fetch()) {
            throw new Exception('Invalid option for this poll');
        }
        
        // Check if user has already voted
        $stmt = $pdo->prepare("
            SELECT id FROM votes 
            WHERE poll_id = ? AND student_id = ?
        ");
        $stmt->execute([$poll_id, $_SESSION['user_id']]);
        
        if ($stmt->fetch()) {
            throw new Exception('You have already voted in this poll');
        }
        
        // Insert vote
        $stmt = $pdo->prepare("
            INSERT INTO votes (poll_id, option_id, student_id, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $poll_id,
            $option_id,
            $_SESSION['user_id'],
            $_SERVER['REMOTE_ADDR'] ?? '',
            $_SERVER['HTTP_USER_AGENT'] ?? ''
        ]);
        
        $vote_id = $pdo->lastInsertId();
        
        // Insert comment if provided and allowed
        if (!empty($comment) && $poll['allow_comments']) {
            $stmt = $pdo->prepare("
                INSERT INTO vote_comments (vote_id, comment) 
                VALUES (?, ?)
            ");
            $stmt->execute([$vote_id, $comment]);
        }
        
        // Commit transaction
        $pdo->commit();
        
        // Log activity (this will be done by trigger, but we can add additional logging)
        log_activity($_SESSION['user_id'], 'vote_cast', "Poll: {$poll['title']}, Option ID: $option_id");
        
        json_response([
            'success' => true,
            'message' => 'Vote cast successfully',
            'vote_id' => $vote_id
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction
        $pdo->rollback();
        
        json_response(['error' => $e->getMessage()], 400);
    }
}

// If not POST request, return error
json_response(['error' => 'Invalid request method'], 405);
?>