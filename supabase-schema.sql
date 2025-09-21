-- Polling App Database Schema
-- This file contains the complete database schema for the polling application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- POLLS TABLE
-- Stores poll information including title, description, and metadata
-- ============================================================================

CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    allow_multiple_votes BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT true,

    -- Ensure expiration date is in the future if provided
    CONSTRAINT polls_expires_at_future CHECK (
        expires_at IS NULL OR expires_at > created_at
    )
);

-- ============================================================================
-- POLL OPTIONS TABLE
-- Stores the voting options for each poll
-- ============================================================================

CREATE TABLE poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL CHECK (length(trim(option_text)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    display_order INTEGER NOT NULL DEFAULT 0,

    -- Ensure unique option text within a poll
    UNIQUE(poll_id, option_text)
);

-- ============================================================================
-- VOTES TABLE
-- Stores user votes on poll options
-- ============================================================================

CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,

    -- Prevent multiple votes per poll per user (unless poll allows it)
    UNIQUE(poll_id, user_id)
);

-- ============================================================================
-- COMMENTS TABLE
-- Stores discussion comments on polls
-- ============================================================================

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    author_email TEXT,
    author_name TEXT,
    author_avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_deleted BOOLEAN NOT NULL DEFAULT false,

    -- Prevent self-referencing parent
    CONSTRAINT comments_no_self_reference CHECK (id != parent_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Polls table indexes
CREATE INDEX idx_polls_created_by ON polls(created_by);
CREATE INDEX idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX idx_polls_is_active ON polls(is_active);
CREATE INDEX idx_polls_expires_at ON polls(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_polls_is_public ON polls(is_public);

-- Poll options table indexes
CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX idx_poll_options_display_order ON poll_options(poll_id, display_order);

-- Votes table indexes
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_option_id ON votes(option_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_created_at ON votes(created_at DESC);
CREATE INDEX idx_votes_poll_user ON votes(poll_id, user_id);

-- Comments table indexes
CREATE INDEX idx_comments_poll_id ON comments(poll_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_poll_created ON comments(poll_id, created_at DESC);

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate vote relationships
CREATE OR REPLACE FUNCTION validate_vote_relationship()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the option belongs to the poll being voted on
    IF NOT EXISTS (
        SELECT 1 FROM poll_options
        WHERE id = NEW.option_id AND poll_id = NEW.poll_id
    ) THEN
        RAISE EXCEPTION 'Option % does not belong to poll %', NEW.option_id, NEW.poll_id;
    END IF;

    -- Check if the poll is still active
    IF NOT EXISTS (
        SELECT 1 FROM polls
        WHERE id = NEW.poll_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Cannot vote on inactive poll %', NEW.poll_id;
    END IF;

    -- Check if the poll has expired
    IF EXISTS (
        SELECT 1 FROM polls
        WHERE id = NEW.poll_id
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
    ) THEN
        RAISE EXCEPTION 'Poll % has expired', NEW.poll_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_polls_updated_at
    BEFORE UPDATE ON polls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER validate_vote_before_insert_update
    BEFORE INSERT OR UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION validate_vote_relationship();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- POLLS POLICIES

-- Anyone can view public active polls
CREATE POLICY "Public polls are viewable by everyone"
    ON polls FOR SELECT
    USING (is_public = true AND is_active = true);

-- Users can view their own polls (including private ones)
CREATE POLICY "Users can view their own polls"
    ON polls FOR SELECT
    USING (auth.uid() = created_by);

-- Users can create their own polls
CREATE POLICY "Users can create polls"
    ON polls FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Users can update their own polls
CREATE POLICY "Users can update their own polls"
    ON polls FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Users can delete their own polls
CREATE POLICY "Users can delete their own polls"
    ON polls FOR DELETE
    USING (auth.uid() = created_by);

-- POLL OPTIONS POLICIES

-- Anyone can view options for public active polls
CREATE POLICY "Options for public polls are viewable by everyone"
    ON poll_options FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE id = poll_id
            AND is_public = true
            AND is_active = true
        )
    );

-- Users can view options for their own polls
CREATE POLICY "Users can view options for their own polls"
    ON poll_options FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE id = poll_id
            AND created_by = auth.uid()
        )
    );

-- Users can manage options for their own polls
CREATE POLICY "Users can manage options for their own polls"
    ON poll_options FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE id = poll_id
            AND created_by = auth.uid()
        )
    );

-- VOTES POLICIES

-- Users can view votes for polls they can access
CREATE POLICY "Users can view votes for accessible polls"
    ON votes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM polls
            WHERE id = poll_id
            AND (
                is_public = true AND is_active = true
                OR created_by = auth.uid()
            )
        )
    );

-- Users can vote on active polls they can access
CREATE POLICY "Users can vote on accessible active polls"
    ON votes FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM polls
            WHERE id = poll_id
            AND is_active = true
            AND (
                is_public = true
                OR created_by = auth.uid()
            )
        )
    );

-- Users can only see their own votes in private polls
CREATE POLICY "Users can only see their own votes in private polls"
    ON votes FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM polls
            WHERE id = poll_id
            AND is_public = true
        )
    );

-- COMMENTS POLICIES

-- Users can view comments for polls they can access
CREATE POLICY "Users can view comments for accessible polls"
    ON comments FOR SELECT
    USING (
        NOT is_deleted
        AND EXISTS (
            SELECT 1 FROM polls
            WHERE id = poll_id
            AND (
                is_public = true AND is_active = true
                OR created_by = auth.uid()
            )
        )
    );

-- Users can create comments on polls they can access
CREATE POLICY "Users can create comments on accessible polls"
    ON comments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM polls
            WHERE id = poll_id
            AND is_active = true
            AND (
                is_public = true
                OR created_by = auth.uid()
            )
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
    ON comments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments (soft delete)
CREATE POLICY "Users can delete their own comments"
    ON comments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- View for poll results with vote counts
CREATE VIEW poll_results AS
SELECT
    p.id as poll_id,
    p.title,
    p.description,
    p.created_by,
    p.created_at,
    p.is_active,
    po.id as option_id,
    po.option_text,
    po.display_order,
    COUNT(v.id) as vote_count
FROM polls p
JOIN poll_options po ON p.id = po.poll_id
LEFT JOIN votes v ON po.id = v.option_id
WHERE p.is_active = true
GROUP BY p.id, p.title, p.description, p.created_by, p.created_at, p.is_active, po.id, po.option_text, po.display_order
ORDER BY p.created_at DESC, po.display_order;

-- View for user's poll participation
CREATE VIEW user_poll_participation AS
SELECT
    u.id as user_id,
    p.id as poll_id,
    p.title,
    v.created_at as voted_at,
    po.option_text as chosen_option
FROM auth.users u
JOIN votes v ON u.id = v.user_id
JOIN polls p ON v.poll_id = p.id
JOIN poll_options po ON v.option_id = po.id
ORDER BY v.created_at DESC;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a poll has expired
CREATE OR REPLACE FUNCTION is_poll_expired(poll_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM polls
        WHERE id = poll_uuid
        AND (expires_at IS NOT NULL AND expires_at < NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get total votes for a poll
CREATE OR REPLACE FUNCTION get_poll_total_votes(poll_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM votes
        WHERE poll_id = poll_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has voted on a poll
CREATE OR REPLACE FUNCTION has_user_voted(poll_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM votes
        WHERE poll_id = poll_uuid AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- Insert sample data for testing (uncomment to use)
/*
-- Sample poll
INSERT INTO polls (title, description, created_by, is_public)
VALUES (
    'What''s your favorite programming language?',
    'Help us understand the community preferences',
    '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
    true
);

-- Sample options for the poll
INSERT INTO poll_options (poll_id, option_text, display_order)
SELECT
    p.id,
    option_text,
    display_order
FROM (VALUES
    ('JavaScript', 1),
    ('Python', 2),
    ('TypeScript', 3),
    ('Rust', 4),
    ('Go', 5)
) AS options(option_text, display_order)
CROSS JOIN (SELECT id FROM polls WHERE title = 'What''s your favorite programming language?' LIMIT 1) p;
*/

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE polls IS 'Stores poll information and metadata';
COMMENT ON TABLE poll_options IS 'Stores voting options for each poll';
COMMENT ON TABLE votes IS 'Stores user votes on poll options';
COMMENT ON TABLE comments IS 'Stores discussion comments on polls (denormalized author data cached)';
COMMENT ON VIEW poll_results IS 'Aggregated view of polls with vote counts';
COMMENT ON VIEW user_poll_participation IS 'View of user voting history';

COMMENT ON COLUMN polls.allow_multiple_votes IS 'Whether users can vote multiple times (future feature)';
COMMENT ON COLUMN polls.is_public IS 'Whether the poll is visible to all users or only creator';
COMMENT ON COLUMN votes.ip_address IS 'IP address for rate limiting and analytics';

-- Schema creation completed successfully!
