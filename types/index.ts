export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

export interface PollOption {
  id: string;
  pollId: string;
  optionText: string;
  displayOrder: number;
  createdAt: Date;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  allowMultipleVotes: boolean;
  isPublic: boolean;
  options: PollOption[];
  totalVotes: number;
}

export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: Date;
  ipAddress?: string;
}

// Form types for creating polls
export interface CreatePollFormData {
  title: string;
  description?: string;
  options: string[];
  expiresAt?: Date;
  isPublic: boolean;
}

export interface PollWithResults extends Poll {
  userVote?: Vote;
  hasVoted: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Database response types (matching Supabase schema)
export interface DatabasePoll {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  is_active: boolean;
  allow_multiple_votes: boolean;
  is_public: boolean;
}

export interface DatabasePollOption {
  id: string;
  poll_id: string;
  option_text: string;
  display_order: number;
  created_at: string;
}

export interface DatabaseVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
  ip_address: string | null;
}
