# Polling App Database Schema

This document explains the database schema for the polling application, including table structures, relationships, security policies, and usage examples.

## 📋 Table Overview

### Core Tables

| Table | Description | Key Relationships |
|-------|-------------|-------------------|
| `polls` | Main poll information | One-to-many with `poll_options` |
| `poll_options` | Voting options for polls | Many-to-one with `polls`, one-to-many with `votes` |
| `votes` | User votes on poll options | Many-to-one with `polls` and `poll_options` |

## 🗂️ Table Structures

### Polls Table
```sql
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    allow_multiple_votes BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT true
);
```

**Key Features:**
- **Auto-generated UUIDs** for secure, unique identifiers
- **Automatic timestamps** with triggers
- **Expiration support** for time-limited polls
- **Public/private visibility** control
- **Future extensibility** with `allow_multiple_votes`

### Poll Options Table
```sql
CREATE TABLE poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    display_order INTEGER NOT NULL DEFAULT 0,

    UNIQUE(poll_id, option_text)
);
```

**Key Features:**
- **Cascading deletes** - options are removed when poll is deleted
- **Unique constraints** prevent duplicate options within a poll
- **Display ordering** for consistent option presentation
- **Text validation** ensures non-empty options

### Votes Table
```sql
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,

    UNIQUE(poll_id, user_id)
);
```

**Key Features:**
- **One vote per user per poll** (configurable via poll settings)
- **Referential integrity** with cascading deletes
- **IP tracking** for analytics and rate limiting
- **Trigger-based validation** ensures option belongs to poll and poll is active

## 🔧 Trigger Functions

### Vote Validation Trigger
The `validate_vote_relationship()` trigger function provides runtime validation:

```sql
CREATE TRIGGER validate_vote_before_insert_update
    BEFORE INSERT OR UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION validate_vote_relationship();
```

**Validations Performed:**
- **Option-Poll Relationship**: Ensures the voted option belongs to the specified poll
- **Poll Status**: Verifies the poll is still active (`is_active = true`)
- **Expiration Check**: Confirms the poll hasn't expired (`expires_at < NOW()`)

**Error Messages:**
- `"Option {option_id} does not belong to poll {poll_id}"`
- `"Cannot vote on inactive poll {poll_id}"`
- `"Poll {poll_id} has expired"`

### Automatic Timestamp Updates
The `update_updated_at_column()` trigger maintains `updated_at` timestamps:

```sql
CREATE TRIGGER update_polls_updated_at
    BEFORE UPDATE ON polls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 🔒 Security & Access Control

### Row Level Security (RLS) Policies

The schema implements comprehensive RLS policies to ensure:

#### Polls Access
- **Public polls**: Viewable by everyone when active
- **Private polls**: Only creator can view/manage
- **Creator permissions**: Full CRUD on own polls

#### Options Access
- **Public polls**: Options visible to everyone
- **Private polls**: Only creator can manage options

#### Votes Access
- **Vote integrity**: Users can only vote on active, accessible polls
- **Privacy**: Users see their own votes; public poll results are visible
- **Prevention**: Duplicate voting prevention

## 📊 Views & Analytics

### Poll Results View
```sql
CREATE VIEW poll_results AS
SELECT
    p.id as poll_id, p.title, p.description,
    po.id as option_id, po.option_text,
    COUNT(v.id) as vote_count
FROM polls p
JOIN poll_options po ON p.id = po.poll_id
LEFT JOIN votes v ON po.id = v.option_id
WHERE p.is_active = true
GROUP BY p.id, po.id
ORDER BY p.created_at DESC, po.display_order;
```

### User Participation View
```sql
CREATE VIEW user_poll_participation AS
SELECT
    u.id as user_id, p.id as poll_id, p.title,
    v.created_at as voted_at, po.option_text as chosen_option
FROM auth.users u
JOIN votes v ON u.id = v.user_id
JOIN polls p ON v.poll_id = p.id
JOIN poll_options po ON v.option_id = po.id;
```

## ⚡ Performance Optimizations

### Indexes Created
- `idx_polls_created_by` - Fast lookup of user's polls
- `idx_polls_created_at` - Recent polls ordering
- `idx_polls_is_active` - Active polls filtering
- `idx_poll_options_poll_id` - Options lookup by poll
- `idx_votes_poll_id`, `idx_votes_user_id` - Vote queries
- `idx_votes_poll_user` - Duplicate vote checking

### Query Performance
- **Aggregated results** via views reduce complex joins
- **Partial indexes** on frequently filtered columns
- **Composite indexes** for common query patterns

## 🚀 Usage Examples

### Creating a Poll
```sql
-- Insert poll
INSERT INTO polls (title, description, created_by, is_public)
VALUES ('Favorite Color?', 'What''s your favorite color?', auth.uid(), true);

-- Add options
INSERT INTO poll_options (poll_id, option_text, display_order)
VALUES
    ((SELECT id FROM polls WHERE title = 'Favorite Color?'), 'Red', 1),
    ((SELECT id FROM polls WHERE title = 'Favorite Color?'), 'Blue', 2),
    ((SELECT id FROM polls WHERE title = 'Favorite Color?'), 'Green', 3);
```

### Casting a Vote
```sql
INSERT INTO votes (poll_id, option_id, user_id)
SELECT
    p.id, po.id, auth.uid()
FROM polls p
JOIN poll_options po ON p.id = po.poll_id
WHERE p.id = 'poll-uuid-here'
  AND po.option_text = 'Blue'
  AND p.is_active = true;
```

### Getting Poll Results
```sql
SELECT * FROM poll_results WHERE poll_id = 'poll-uuid-here';
```

## 🔧 Helper Functions

### Available Functions
- `is_poll_expired(poll_uuid)` - Check if poll has expired
- `get_poll_total_votes(poll_uuid)` - Get total vote count
- `has_user_voted(poll_uuid, user_uuid)` - Check voting status

## 📦 Setup Instructions

1. **Connect to Supabase**
   ```bash
   # Via Supabase Dashboard
   # Go to your project → SQL Editor
   ```

2. **Run the Schema**
   ```sql
   -- Execute the entire supabase-schema.sql file
   ```

3. **Verify Setup**
   ```sql
   -- Check tables were created
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';

   -- Check RLS is enabled
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';
   ```

## 🎯 Best Practices

### Data Integrity
- Always use transactions for multi-table operations
- Validate poll expiration before allowing votes
- Check user permissions before data access

### Performance
- Use the `poll_results` view for displaying results
- Implement pagination for large result sets
- Consider archiving old polls after expiration

### Security
- Never bypass RLS policies in application code
- Regularly audit user permissions
- Monitor for suspicious voting patterns

## 🔄 Future Enhancements

### Planned Features
- **Multiple choice support** (currently one-vote-per-poll)
- **Vote weighting** by user reputation
- **Poll categories/tags** for organization
- **Real-time vote updates** via Supabase realtime
- **Vote anonymity options**

### Scalability Considerations
- **Partitioning** for large vote tables
- **Caching** frequently accessed poll results
- **Archive strategy** for completed polls

---

**Need Help?** Refer to the Supabase documentation or check the application code for integration examples.
