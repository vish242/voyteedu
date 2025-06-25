<?php
require_once 'config.php';

// Check if user is logged in
if (!is_logged_in()) {
    json_response(['error' => 'Unauthorized access'], 403);
}

try {
    $user_type = $_SESSION['user_type'];
    $user_id = $_SESSION['user_id'];
    
    if ($user_type === 'student') {
        // Student statistics
        $stats = [];
        
        // Total votes by this student
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM votes WHERE student_id = ?");
        $stmt->execute([$user_id]);
        $stats['total_votes'] = $stmt->fetchColumn();
        
        // Active polls
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM polls 
            WHERE status = 'active' 
            AND start_date <= NOW() 
            AND end_date > NOW()
        ");
        $stmt->execute();
        $stats['active_polls'] = $stmt->fetchColumn();
        
        // Pending votes (polls user hasn't voted in)
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM polls p
            WHERE p.status = 'active' 
            AND p.start_date <= NOW() 
            AND p.end_date > NOW()
            AND NOT EXISTS (
                SELECT 1 FROM votes v 
                WHERE v.poll_id = p.id AND v.student_id = ?
            )
        ");
        $stmt->execute([$user_id]);
        $stats['pending_votes'] = $stmt->fetchColumn();
        
        // Participation rate
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(DISTINCT p.id) as total_polls,
                COUNT(DISTINCT v.poll_id) as voted_polls
            FROM polls p
            LEFT JOIN votes v ON p.id = v.poll_id AND v.student_id = ?
            WHERE p.status IN ('active', 'closed')
            AND p.start_date <= NOW()
        ");
        $stmt->execute([$user_id]);
        $participation = $stmt->fetch();
        
        $stats['participation_rate'] = $participation['total_polls'] > 0 ? 
            round(($participation['voted_polls'] / $participation['total_polls']) * 100) : 0;
        
    } else {
        // Admin statistics
        $stats = [];
        
        // Total students
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM students WHERE is_active = TRUE");
        $stmt->execute();
        $stats['total_students'] = $stmt->fetchColumn();
        
        // Total polls
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM polls");
        $stmt->execute();
        $stats['total_polls'] = $stmt->fetchColumn();
        
        // Total votes
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM votes");
        $stmt->execute();
        $stats['total_votes'] = $stmt->fetchColumn();
        
        // Active polls
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM polls 
            WHERE status = 'active'
        ");
        $stmt->execute();
        $stats['active_polls'] = $stmt->fetchColumn();
        
        // Overall participation rate
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(DISTINCT s.id) as total_students,
                COUNT(DISTINCT v.student_id) as voting_students
            FROM students s
            LEFT JOIN votes v ON s.id = v.student_id
            WHERE s.is_active = TRUE
        ");
        $stmt->execute();
        $participation = $stmt->fetch();
        
        $stats['participation_rate'] = $participation['total_students'] > 0 ? 
            round(($participation['voting_students'] / $participation['total_students']) * 100) : 0;
        
        // Voting activity for the last 7 days (for charts)
        $stmt = $pdo->prepare("
            SELECT 
                DATE(v.created_at) as vote_date,
                COUNT(*) as vote_count
            FROM votes v
            WHERE v.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(v.created_at)
            ORDER BY vote_date
        ");
        $stmt->execute();
        $stats['daily_votes'] = $stmt->fetchAll();
        
        // Poll creation activity
        $stmt = $pdo->prepare("
            SELECT 
                DATE(p.created_at) as poll_date,
                COUNT(*) as poll_count
            FROM polls p
            WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(p.created_at)
            ORDER BY poll_date
        ");
        $stmt->execute();
        $stats['daily_polls'] = $stmt->fetchAll();
        
        // Category distribution
        $stmt = $pdo->prepare("
            SELECT 
                pc.name as category_name,
                COUNT(p.id) as poll_count
            FROM poll_categories pc
            LEFT JOIN polls p ON pc.id = p.category_id
            GROUP BY pc.id, pc.name
            ORDER BY poll_count DESC
        ");
        $stmt->execute();
        $stats['category_distribution'] = $stmt->fetchAll();
    }
    
    json_response([
        'success' => true,
        'stats' => $stats
    ]);
    
} catch (PDOException $e) {
    error_log("Get stats error: " . $e->getMessage());
    json_response(['error' => 'Failed to fetch statistics'], 500);
}
?>