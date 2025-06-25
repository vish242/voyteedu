/*
  # VoteEdu Database Schema for Supabase
  
  1. New Tables
    - `students` - Student user accounts with authentication details
    - `administrators` - Admin user accounts for system management
    - `poll_categories` - Categories for organizing polls
    - `polls` - Main polls table with voting configuration
    - `poll_options` - Individual options for each poll
    - `votes` - Student votes with tracking information
    - `vote_comments` - Optional comments on votes
    - `activity_logs` - System activity tracking
    - `login_attempts` - Security tracking for login attempts
    - `system_settings` - Configurable system settings

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for admins to manage system data
    - Secure voting process with proper constraints

  3. Features
    - Student authentication and profile management
    - Poll creation and management by admins
    - Real-time voting with result tracking
    - Activity logging and security monitoring
    - Configurable system settings
*/

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    class text,
    department text,
    year_of_study integer,
    is_active boolean DEFAULT true,
    email_verified boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_login timestamptz,
    
    CONSTRAINT students_student_id_check CHECK (length(student_id) >= 3),
    CONSTRAINT students_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT students_year_check CHECK (year_of_study >= 1 AND year_of_study <= 6)
);

-- Create indexes for students table
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);

-- Administrators table
CREATE TABLE IF NOT EXISTS administrators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_login timestamptz,
    
    CONSTRAINT administrators_username_check CHECK (length(username) >= 3),
    CONSTRAINT administrators_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for administrators table
CREATE INDEX IF NOT EXISTS idx_administrators_username ON administrators(username);
CREATE INDEX IF NOT EXISTS idx_administrators_email ON administrators(email);
CREATE INDEX IF NOT EXISTS idx_administrators_active ON administrators(is_active);

-- Poll categories table
CREATE TABLE IF NOT EXISTS poll_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    color text DEFAULT '#3B82F6',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT poll_categories_name_check CHECK (length(name) >= 2),
    CONSTRAINT poll_categories_slug_check CHECK (slug ~* '^[a-z0-9_-]+$'),
    CONSTRAINT poll_categories_color_check CHECK (color ~* '^#[0-9A-Fa-f]{6}$')
);

-- Create indexes for poll_categories table
CREATE INDEX IF NOT EXISTS idx_poll_categories_slug ON poll_categories(slug);
CREATE INDEX IF NOT EXISTS idx_poll_categories_active ON poll_categories(is_active);

-- Polls table
CREATE TABLE IF NOT EXISTS polls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    category_id uuid REFERENCES poll_categories(id) ON DELETE SET NULL,
    created_by uuid NOT NULL REFERENCES administrators(id) ON DELETE CASCADE,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'cancelled')),
    start_date timestamptz NOT NULL,
    end_date timestamptz NOT NULL,
    allow_comments boolean DEFAULT true,
    allow_multiple_votes boolean DEFAULT false,
    is_anonymous boolean DEFAULT true,
    max_votes_per_user integer DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT polls_title_check CHECK (length(title) >= 5),
    CONSTRAINT polls_dates_check CHECK (end_date > start_date),
    CONSTRAINT polls_max_votes_check CHECK (max_votes_per_user >= 1)
);

-- Create indexes for polls table
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_category ON polls(category_id);
CREATE INDEX IF NOT EXISTS idx_polls_dates ON polls(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);

-- Poll options table
CREATE TABLE IF NOT EXISTS poll_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    option_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT poll_options_text_check CHECK (length(option_text) >= 1),
    CONSTRAINT poll_options_order_check CHECK (option_order >= 0)
);

-- Create indexes for poll_options table
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_order ON poll_options(poll_id, option_order);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id uuid NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT votes_unique_vote UNIQUE (poll_id, student_id)
);

-- Create indexes for votes table
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_option_id ON votes(option_id);
CREATE INDEX IF NOT EXISTS idx_votes_student_id ON votes(student_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);

-- Vote comments table
CREATE TABLE IF NOT EXISTS vote_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vote_id uuid NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
    comment text NOT NULL,
    is_anonymous boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT vote_comments_comment_check CHECK (length(comment) >= 1)
);

-- Create indexes for vote_comments table
CREATE INDEX IF NOT EXISTS idx_vote_comments_vote_id ON vote_comments(vote_id);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    user_type text NOT NULL CHECK (user_type IN ('student', 'admin')),
    action text NOT NULL,
    details text,
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT activity_logs_action_check CHECK (length(action) >= 1)
);

-- Create indexes for activity_logs table
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Login attempts table (for security)
CREATE TABLE IF NOT EXISTS login_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL, -- email, student_id, or username
    ip_address inet NOT NULL,
    attempt_time timestamptz DEFAULT now(),
    success boolean DEFAULT false,
    
    CONSTRAINT login_attempts_identifier_check CHECK (length(identifier) >= 1)
);

-- Create indexes for login_attempts table
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier ON login_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempt_time ON login_attempts(attempt_time);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key text UNIQUE NOT NULL,
    setting_value text,
    setting_type text DEFAULT 'string' CHECK (setting_type IN ('string', 'integer', 'boolean', 'json')),
    description text,
    is_public boolean DEFAULT false,
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT system_settings_key_check CHECK (length(setting_key) >= 1)
);

-- Create indexes for system_settings table
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);

-- Enable Row Level Security on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students table
CREATE POLICY "Students can read own data" ON students
    FOR SELECT TO authenticated
    USING (auth.uid()::text = id::text);

CREATE POLICY "Students can update own data" ON students
    FOR UPDATE TO authenticated
    USING (auth.uid()::text = id::text);

-- RLS Policies for administrators table
CREATE POLICY "Admins can read own data" ON administrators
    FOR SELECT TO authenticated
    USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can update own data" ON administrators
    FOR UPDATE TO authenticated
    USING (auth.uid()::text = id::text);

-- RLS Policies for poll_categories table
CREATE POLICY "Anyone can read active poll categories" ON poll_categories
    FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "Admins can manage poll categories" ON poll_categories
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM administrators 
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );

-- RLS Policies for polls table
CREATE POLICY "Anyone can read active polls" ON polls
    FOR SELECT TO authenticated
    USING (status = 'active' AND start_date <= now() AND end_date > now());

CREATE POLICY "Admins can manage polls" ON polls
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM administrators 
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );

-- RLS Policies for poll_options table
CREATE POLICY "Anyone can read poll options for active polls" ON poll_options
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM polls 
            WHERE id = poll_id AND status = 'active' 
            AND start_date <= now() AND end_date > now()
        )
    );

CREATE POLICY "Admins can manage poll options" ON poll_options
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM administrators 
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );

-- RLS Policies for votes table
CREATE POLICY "Students can read own votes" ON votes
    FOR SELECT TO authenticated
    USING (student_id::text = auth.uid()::text);

CREATE POLICY "Students can insert own votes" ON votes
    FOR INSERT TO authenticated
    WITH CHECK (student_id::text = auth.uid()::text);

CREATE POLICY "Admins can read all votes" ON votes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM administrators 
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );

-- RLS Policies for vote_comments table
CREATE POLICY "Students can read own vote comments" ON vote_comments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM votes 
            WHERE id = vote_id AND student_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Students can insert own vote comments" ON vote_comments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM votes 
            WHERE id = vote_id AND student_id::text = auth.uid()::text
        )
    );

-- RLS Policies for activity_logs table
CREATE POLICY "Users can read own activity logs" ON activity_logs
    FOR SELECT TO authenticated
    USING (user_id::text = auth.uid()::text);

CREATE POLICY "System can insert activity logs" ON activity_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- RLS Policies for login_attempts table
CREATE POLICY "Admins can read login attempts" ON login_attempts
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM administrators 
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );

-- RLS Policies for system_settings table
CREATE POLICY "Anyone can read public settings" ON system_settings
    FOR SELECT TO authenticated
    USING (is_public = true);

CREATE POLICY "Admins can manage all settings" ON system_settings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM administrators 
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );

-- Insert default poll categories
INSERT INTO poll_categories (name, slug, description, color) VALUES
('Class Schedule', 'class_schedule', 'Polls related to class scheduling, cancellations, and timing', '#3B82F6'),
('Lecture Feedback', 'lecture_feedback', 'Feedback and ratings for lectures and teaching quality', '#8B5CF6'),
('Campus Facilities', 'campus_facilities', 'Polls about campus facilities, library, cafeteria, etc.', '#10B981'),
('Student Services', 'student_services', 'Polls related to student services and support', '#F59E0B'),
('General Opinion', 'general_opinion', 'General opinion polls and surveys', '#EF4444');

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', 'VoteEdu', 'string', 'Name of the voting system', true),
('site_description', 'Student Voting System for Educational Decisions', 'string', 'Description of the voting system', true),
('max_poll_duration', '30', 'integer', 'Maximum poll duration in days', false),
('allow_anonymous_voting', 'true', 'boolean', 'Allow anonymous voting', false),
('require_email_verification', 'false', 'boolean', 'Require email verification for new accounts', false),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', false);

-- Create views for easier data access

-- View for poll statistics
CREATE OR REPLACE VIEW poll_stats AS
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
CREATE OR REPLACE VIEW student_participation AS
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
CREATE OR REPLACE VIEW poll_results AS
SELECT 
    p.id as poll_id,
    p.title as poll_title,
    po.id as option_id,
    po.option_text,
    COUNT(v.id) as vote_count,
    ROUND((COUNT(v.id) * 100.0 / NULLIF(total_votes.total, 0))::numeric, 2) as percentage
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

-- Functions for automatic updates

-- Function to update poll status based on dates
CREATE OR REPLACE FUNCTION update_poll_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.start_date <= now() AND NEW.end_date > now() AND NEW.status = 'draft' THEN
        NEW.status = 'active';
    ELSIF NEW.end_date <= now() AND NEW.status = 'active' THEN
        NEW.status = 'closed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update poll status
CREATE TRIGGER trigger_update_poll_status
    BEFORE UPDATE ON polls
    FOR EACH ROW
    EXECUTE FUNCTION update_poll_status();

-- Function to log vote activity
CREATE OR REPLACE FUNCTION log_vote_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_logs (user_id, user_type, action, details, created_at)
    VALUES (NEW.student_id, 'student', 'vote_cast', 
            'Poll ID: ' || NEW.poll_id || ', Option ID: ' || NEW.option_id, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log vote activity
CREATE TRIGGER trigger_log_vote_activity
    AFTER INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION log_vote_activity();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at columns
CREATE TRIGGER trigger_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_administrators_updated_at
    BEFORE UPDATE ON administrators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_polls_updated_at
    BEFORE UPDATE ON polls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get poll results
CREATE OR REPLACE FUNCTION get_poll_results(poll_uuid uuid)
RETURNS TABLE (
    option_id uuid,
    option_text text,
    vote_count bigint,
    percentage numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        po.id as option_id,
        po.option_text,
        COUNT(v.id) as vote_count,
        ROUND((COUNT(v.id) * 100.0 / NULLIF(total_votes.total, 0))::numeric, 2) as percentage
    FROM poll_options po
    LEFT JOIN votes v ON po.id = v.option_id
    JOIN (
        SELECT COUNT(*) as total
        FROM votes
        WHERE poll_id = poll_uuid
    ) total_votes ON true
    WHERE po.poll_id = poll_uuid
    GROUP BY po.id, po.option_text, total_votes.total
    ORDER BY po.option_order;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old login attempts
CREATE OR REPLACE FUNCTION cleanup_login_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM login_attempts 
    WHERE attempt_time < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;