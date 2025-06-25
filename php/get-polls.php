<?php
require_once 'config.php';

// Check if user is logged in
if (!is_logged_in()) {
    json_response(['error' => 'Unauthorized access'], 403);
}

try {
    $user_id = $_SESSION['user_id'];
    $user_type = $_SESSION['user_type'];
    
    // Base query for polls
    $query = "
        SELECT 
            p.id,
            p.title,
            p.description,
            p.status,
            p.start_date,
            p.end_date,
            p.allow_comments,
            pc.name as category_name,
            pc.slug as category_slug,
            pc.color as category_color,
            COUNT(DISTINCT v.id) as total_votes,
            " . ($user_type === 'student' ? "
            CASE WHEN uv.id IS NOT NULL THEN 1 ELSE 0 END as has_voted
            " : "0 as has_voted") . "
        FROM polls p
        LEFT JOIN poll_categories pc ON p.category_id = pc.id
        LEFT JOIN votes v ON p.id = v.poll_id
        " . ($user_type === 'student' ? "
        LEFT JOIN votes uv ON p.id = uv.poll_id AND uv.student_id = ?
        " : "") . "
        WHERE p.status = 'active'
        AND p.start_date <= NOW()
        AND p.end_date > NOW()
        GROUP BY p.id, p.title, p.description, p.status, p.start_date, p.end_date, 
                 p.allow_comments, pc.name, pc.slug, pc.color" . 
                 ($user_type === 'student' ? ", uv.id" : "") . "
        ORDER BY p.created_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    
    if ($user_type === 'student') {
        $stmt->execute([$user_id]);
    } else {
        $stmt->execute();
    }
    
    $polls = $stmt->fetchAll();
    
    // Get options for each poll
    foreach ($polls as &$poll) {
        $stmt = $pdo->prepare("
            SELECT 
                po.id,
                po.option_text,
                COUNT(v.id) as vote_count
            FROM poll_options po
            LEFT JOIN votes v ON po.id = v.option_id
            WHERE po.poll_id = ? AND po.is_active = TRUE
            GROUP BY po.id, po.option_text
            ORDER BY po.option_order
        ");
        $stmt->execute([$poll['id']]);
        $poll['options'] = $stmt->fetchAll();
        
        // Calculate percentages
        $total_votes = intval($poll['total_votes']);
        foreach ($poll['options'] as &$option) {
            $option['vote_count'] = intval($option['vote_count']);
            $option['percentage'] = $total_votes > 0 ? 
                round(($option['vote_count'] / $total_votes) * 100, 1) : 0;
        }
    }
    
    json_response([
        'success' => true,
        'polls' => $polls
    ]);
    
} catch (PDOException $e) {
    error_log("Get polls error: " . $e->getMessage());
    json_response(['error' => 'Failed to fetch polls'], 500);
}
?>