-- ============================================================================
-- COMMENTS SYSTEM MIGRATION
-- Run this script in your Supabase SQL Editor to add comments functionality
-- ============================================================================

-- ============================================================================
-- COMMENTS TABLE
-- Stores discussion comments on polls
-- ============================================================================

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
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

-- Comments table indexes
CREATE INDEX IF NOT EXISTS idx_comments_poll_id ON comments(poll_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_poll_created ON comments(poll_id, created_at DESC);

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

-- Apply trigger for comments table
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on comments table
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- COMMENTS POLICIES

-- Users can view comments for polls they can access
CREATE POLICY "Users can view comments for accessible polls" ON comments
    FOR SELECT USING (
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
CREATE POLICY "Users can create comments on accessible polls" ON comments
    FOR INSERT WITH CHECK (
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
CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments (soft delete)
CREATE POLICY "Users can delete their own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get comment count for a poll
CREATE OR REPLACE FUNCTION get_comment_count(poll_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM comments
        WHERE poll_id = poll_uuid AND is_deleted = false
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE comments IS 'Stores discussion comments on polls';

-- ============================================================================
-- MIGRATION COMPLETED SUCCESSFULLY!
-- ============================================================================

-- You can now run the following queries to verify the migration:

-- Check that the comments table was created
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'comments';

-- Check that indexes were created
-- SELECT indexname FROM pg_indexes WHERE tablename = 'comments';

-- Check that RLS policies were created
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'comments';

-- Check that triggers were created
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'comments';
