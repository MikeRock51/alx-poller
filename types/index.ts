/**
 * Represents a user account in the application.
 *
 * This interface defines the structure of user data as used throughout
 * the frontend application. Note that this may differ from the database
 * schema which uses different field names (e.g., created_at vs createdAt).
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name: string;
  /** Optional profile avatar URL */
  avatar?: string;
  /** Account creation timestamp */
  createdAt: Date;
}

/**
 * Represents a voting option within a poll.
 *
 * Each poll can have multiple options that users can vote on.
 * The display order determines how options are presented to users.
 */
export interface PollOption {
  /** Unique identifier for the option */
  id: string;
  /** ID of the poll this option belongs to */
  pollId: string;
  /** The text content of the voting option */
  optionText: string;
  /** Order in which this option should be displayed (1-based) */
  displayOrder: number;
  /** When this option was created */
  createdAt: Date;
  /** Number of votes this option has received */
  votes: number;
}

/**
 * Represents a complete poll with all its metadata and options.
 *
 * This is the main data structure for polls in the application,
 * containing all information needed to display and manage a poll.
 */
export interface Poll {
  /** Unique identifier for the poll */
  id: string;
  /** Poll title/question */
  title: string;
  /** Optional detailed description */
  description?: string;
  /** ID of the user who created the poll */
  createdBy: string;
  /** Poll creation timestamp */
  createdAt: Date;
  /** Last modification timestamp */
  updatedAt: Date;
  /** Optional expiration date for time-limited polls */
  expiresAt?: Date;
  /** Whether the poll is currently active and accepting votes */
  isActive: boolean;
  /** Whether users can vote multiple times (reserved for future use) */
  allowMultipleVotes: boolean;
  /** Whether the poll is publicly visible or private */
  isPublic: boolean;
  /** Array of voting options for this poll */
  options: PollOption[];
  /** Total number of votes cast on this poll */
  totalVotes: number;
}

/**
 * Represents a single vote cast by a user on a poll option.
 *
 * Votes are the core interaction records that track user participation
 * in polls. Each user can have at most one vote per poll.
 */
export interface Vote {
  /** Unique identifier for the vote */
  id: string;
  /** ID of the poll this vote was cast on */
  pollId: string;
  /** ID of the specific option that was voted for */
  optionId: string;
  /** ID of the user who cast this vote */
  userId: string;
  /** When this vote was cast */
  createdAt: Date;
  /** Optional IP address for analytics (future use) */
  ipAddress?: string;
}

/**
 * Represents a comment on a poll.
 *
 * Comments allow users to discuss polls and share their thoughts.
 * Comments support threaded discussions through parent_id references.
 */
export interface Comment {
  /** Unique identifier for the comment */
  id: string;
  /** ID of the poll this comment belongs to */
  pollId: string;
  /** ID of the user who wrote this comment */
  userId: string;
  /** Content of the comment */
  content: string;
  /** When this comment was created */
  createdAt: Date;
  /** When this comment was last updated */
  updatedAt: Date;
  /** ID of the parent comment (for threaded replies) */
  parentId?: string;
  /** Whether this comment has been soft-deleted */
  isDeleted: boolean;
  /** Author information (populated from auth.users) */
  author?: User;
  /** Nested replies to this comment */
  replies?: Comment[];
}

/**
 * Form data structure for creating new comments.
 *
 * This interface defines the shape of data submitted through comment forms.
 */
export interface CreateCommentFormData {
  /** Content of the comment */
  content: string;
  /** ID of the poll this comment belongs to */
  pollId: string;
  /** Optional parent comment ID for replies */
  parentId?: string;
}

/**
 * Form data structure for updating existing comments.
 */
export interface UpdateCommentFormData {
  /** Updated content of the comment */
  content: string;
}

/**
 * Form data structure for creating new polls.
 *
 * This interface defines the shape of data submitted through poll creation forms.
 * It includes validation rules and optional fields for flexible poll creation.
 */
export interface CreatePollFormData {
  /** The poll question or title */
  title: string;
  /** Optional detailed description */
  description?: string;
  /** Array of voting option texts */
  options: string[];
  /** Optional expiration date */
  expiresAt?: Date;
  /** Whether the poll should be publicly visible */
  isPublic: boolean;
}

/**
 * Extended poll interface that includes voting results and user interaction status.
 *
 * This type is used when displaying polls with voting results and user-specific
 * information like whether they've already voted and which option they chose.
 */
export interface PollWithResults extends Poll {
  /** The user's vote on this poll, if they have voted */
  userVote?: Vote;
  /** Whether the current user has already voted on this poll */
  hasVoted: boolean;
}

/**
 * Authentication state representation for components.
 *
 * This interface provides a simplified view of authentication state
 * for components that need to react to authentication changes.
 */
export interface AuthState {
  /** Currently authenticated user, or null if not logged in */
  user: User | null;
  /** Whether a user is currently authenticated */
  isAuthenticated: boolean;
  /** Whether authentication state is still being determined */
  isLoading: boolean;
}

// Database response types (matching Supabase schema)

/**
 * Database representation of a poll record.
 *
 * This interface matches the exact structure returned by Supabase queries
 * against the polls table. Field names use snake_case to match database conventions,
 * and timestamps are strings rather than Date objects.
 */
export interface DatabasePoll {
  /** Unique identifier (UUID) */
  id: string;
  /** Poll title/question */
  title: string;
  /** Optional description (null if not provided) */
  description: string | null;
  /** ID of the user who created the poll */
  created_by: string;
  /** Creation timestamp (ISO string) */
  created_at: string;
  /** Last update timestamp (ISO string) */
  updated_at: string;
  /** Optional expiration timestamp (ISO string, null if no expiration) */
  expires_at: string | null;
  /** Whether the poll is currently active */
  is_active: boolean;
  /** Whether multiple votes are allowed per user (reserved for future) */
  allow_multiple_votes: boolean;
  /** Whether the poll is publicly visible */
  is_public: boolean;
}

/**
 * Database representation of a poll option record.
 *
 * This matches the structure of records in the poll_options table,
 * which stores the individual voting choices for each poll.
 */
export interface DatabasePollOption {
  /** Unique identifier (UUID) */
  id: string;
  /** ID of the poll this option belongs to */
  poll_id: string;
  /** The text content of the option */
  option_text: string;
  /** Display order (1-based numbering) */
  display_order: number;
  /** Creation timestamp (ISO string) */
  created_at: string;
}

/**
 * Database representation of a vote record.
 *
 * This matches the structure of records in the votes table,
 * tracking individual votes cast by users on poll options.
 */
export interface DatabaseVote {
  /** Unique identifier (UUID) */
  id: string;
  /** ID of the poll this vote was cast on */
  poll_id: string;
  /** ID of the option that was voted for */
  option_id: string;
  /** ID of the user who cast this vote */
  user_id: string;
  /** Vote timestamp (ISO string) */
  created_at: string;
  /** Optional IP address for analytics (null allowed) */
  ip_address: string | null;
}

/**
 * Database representation of a comment record.
 *
 * This matches the structure of records in the comments table,
 * storing discussion comments on polls.
 */
export interface DatabaseComment {
  /** Unique identifier (UUID) */
  id: string;
  /** ID of the poll this comment belongs to */
  poll_id: string;
  /** ID of the user who wrote this comment */
  user_id: string;
  /** Content of the comment */
  content: string;
  /** Creation timestamp (ISO string) */
  created_at: string;
  /** Last update timestamp (ISO string) */
  updated_at: string;
  /** ID of the parent comment (null for top-level comments) */
  parent_id: string | null;
  /** Whether this comment has been soft-deleted */
  is_deleted: boolean;
}
