"use server";

import { createClient } from "@/lib/supabase/server";
import { CreatePollFormData, DatabasePoll, DatabasePollOption } from "@/types";
import { revalidatePath } from "next/cache";

// Helper Functions

/**
 * Retrieves the currently authenticated user and Supabase client instance.
 *
 * This function serves as a central point for authentication verification
 * across all poll-related server actions. It ensures consistent error handling
 * and provides both the user object and client for subsequent operations.
 *
 * @returns {Promise<{supabase: any, user: any, error: any}>}
 *   Object containing the Supabase client, authenticated user, and any authentication error
 */
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  return { supabase, user, error };
}

/**
 * Validates poll options to ensure they meet the minimum requirements for a poll.
 *
 * This function performs comprehensive validation on poll options including:
 * - Minimum option count requirement
 * - Removal of empty/whitespace-only options
 * - Deduplication of identical options
 * - Ensuring at least 2 valid unique options remain
 *
 * @param {string[]} options - Array of option strings to validate
 * @returns {{isValid: boolean, error?: string, validOptions?: string[]}}
 *   Validation result with success status, error message (if invalid), and cleaned options array
 */
function validatePollOptions(options: string[]): { isValid: boolean; error?: string; validOptions?: string[] } {
  if (options.length < 2) {
    return { isValid: false, error: "A poll must have at least 2 options" };
  }

  // Clean and deduplicate options: trim whitespace, filter empty strings, remove duplicates
  const validOptions = options
    .map(option => option.trim()) // Remove leading/trailing whitespace
    .filter(option => option.length > 0) // Remove empty strings
    .filter((option: string, index: number, arr: string[]) => arr.indexOf(option) === index); // Remove duplicates

  if (validOptions.length < 2) {
    return { isValid: false, error: "A poll must have at least 2 unique, non-empty options" };
  }

  return { isValid: true, validOptions };
}

/**
 * Efficiently retrieves vote counts for multiple polls in a single database query.
 *
 * This function optimizes vote counting by fetching all votes for the specified polls
 * at once and aggregating them in memory. This reduces database round trips and
 * improves performance when displaying multiple polls with their vote counts.
 *
 * @param {any} supabase - Supabase client instance
 * @param {string[]} pollIds - Array of poll IDs to get vote counts for
 * @returns {Promise<Map<string, number>>} Map of poll IDs to their vote counts
 */
async function getVoteCounts(supabase: any, pollIds: string[]) {
  if (pollIds.length === 0) return new Map();

  // Single query to get all votes for the specified polls
  const { data: votes } = await supabase
    .from("votes")
    .select("poll_id")
    .in("poll_id", pollIds);

  // Aggregate vote counts in memory for efficiency
  const voteCountMap = new Map<string, number>();
  votes?.forEach((vote: any) => {
    const count = voteCountMap.get(vote.poll_id) || 0;
    voteCountMap.set(vote.poll_id, count + 1);
  });

  return voteCountMap;
}

/**
 * Verifies that a user has ownership permissions for a specific poll.
 *
 * This function ensures that users can only modify polls they created themselves.
 * It's used as a security check before allowing edit or delete operations on polls.
 *
 * @param {any} supabase - Supabase client instance
 * @param {string} pollId - UUID of the poll to check ownership for
 * @param {string} userId - UUID of the user attempting the operation
 * @returns {Promise<{error?: string, poll?: any}>}
 *   Either an error message or the poll object if ownership is verified
 */
async function verifyPollOwnership(supabase: any, pollId: string, userId: string) {
  const { data: poll, error } = await supabase
    .from("polls")
    .select("created_by")
    .eq("id", pollId)
    .single();

  if (error || !poll) {
    return { error: "Poll not found" };
  }

  if (poll.created_by !== userId) {
    return { error: "You can only edit your own polls" };
  }

  return { poll };
}

/**
 * Updates poll options by synchronizing the database with new option data.
 *
 * This function handles the complex logic of updating poll options by:
 * 1. Updating existing options in place (preserving IDs for vote integrity)
 * 2. Adding new options when the new set is larger
 * 3. Removing excess options when the new set is smaller
 *
 * This approach maintains referential integrity for existing votes while allowing
 * poll creators to modify their polls.
 *
 * @param {any} supabase - Supabase client instance
 * @param {string} pollId - UUID of the poll to update options for
 * @param {string[]} validOptions - Array of cleaned, validated option texts
 * @throws {Error} If any database operation fails during the update process
 */
async function updatePollOptions(supabase: any, pollId: string, validOptions: string[]) {
  // Fetch existing options to understand current state
  const { data: existingOptions } = await supabase
    .from("poll_options")
    .select("id, option_text")
    .eq("poll_id", pollId);

  // Update existing options and add new ones
  for (let i = 0; i < validOptions.length; i++) {
    const optionText = validOptions[i];

    if (existingOptions && i < existingOptions.length) {
      // Update existing option in place to preserve vote relationships
      const { error: optionError } = await supabase
        .from("poll_options")
        .update({ option_text: optionText })
        .eq("id", existingOptions[i].id);

      if (optionError) {
        throw new Error("Failed to update poll options");
      }
    } else {
      // Add new option when expanding beyond existing options
      const { error: optionError } = await supabase
        .from("poll_options")
        .insert({
          poll_id: pollId,
          option_text: optionText,
          display_order: i + 1,
        });

      if (optionError) {
        throw new Error("Failed to add poll options");
      }
    }
  }

  // Remove excess options if the new set is smaller than existing
  if (existingOptions && existingOptions.length > validOptions.length) {
    const optionsToDelete = existingOptions
      .slice(validOptions.length) // Get options beyond the new length
      .map((opt: any) => opt.id);

    if (optionsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("poll_options")
        .delete()
        .in("id", optionsToDelete);

      if (deleteError) {
        throw new Error("Failed to update poll options");
      }
    }
  }
}

/**
 * Creates a new poll with the provided form data.
 *
 * This server action handles the complete poll creation process including:
 * 1. Authentication verification
 * 2. Input validation and sanitization
 * 3. Database transaction for poll and options creation
 * 4. Error handling with cleanup on partial failures
 * 5. Cache revalidation for immediate UI updates
 *
 * The function ensures atomicity - if poll options creation fails,
 * the poll itself is deleted to maintain database consistency.
 *
 * @param {CreatePollFormData} formData - Validated form data from the poll creation form
 * @returns {Promise<{success?: boolean, poll?: any, error?: string}>}
 *   Success result with created poll data or error message
 */
export async function createPoll(formData: CreatePollFormData) {
  try {
    // Verify user authentication before proceeding
    const { supabase, user, error: userError } = await getAuthenticatedUser();

    if (userError || !user) {
      return { error: "You must be logged in to create a poll" };
    }

    // Validate and sanitize input data
    if (!formData.title.trim()) {
      return { error: "Poll title is required" };
    }

    const optionsValidation = validatePollOptions(formData.options);
    if (!optionsValidation.isValid) {
      return { error: optionsValidation.error };
    }

    const validOptions = optionsValidation.validOptions!;

    // Prepare poll data with sanitized inputs
    const pollData = {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      created_by: user.id,
      expires_at: formData.expiresAt?.toISOString() || null,
      is_public: formData.isPublic,
      allow_multiple_votes: false, // For now, single vote per poll
    };

    // Create the poll record
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert(pollData)
      .select()
      .single();

    if (pollError) {
      console.error("Error creating poll:", pollError);
      return { error: "Failed to create poll. Please try again." };
    }

    // Create associated poll options
    const optionsData = validOptions.map((optionText, index) => ({
      poll_id: poll.id,
      option_text: optionText,
      display_order: index + 1,
    }));

    const { error: optionsError } = await supabase
      .from("poll_options")
      .insert(optionsData);

    if (optionsError) {
      console.error("Error creating poll options:", optionsError);
      // Rollback: delete the poll if options creation fails
      await supabase.from("polls").delete().eq("id", poll.id);
      return { error: "Failed to create poll options. Please try again." };
    }

    // Revalidate the polls page to show the new poll immediately
    revalidatePath("/polls");

    return { success: true, poll };
  } catch (error) {
    console.error("Unexpected error creating poll:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Retrieves all active polls with their options and vote counts.
 *
 * This function fetches polls for public display, including:
 * 1. All active polls (not deleted/inactive)
 * 2. Associated poll options for each poll
 * 3. Vote counts aggregated efficiently in a single query
 * 4. Results ordered by creation date (newest first)
 *
 * The function uses an optimized approach to avoid N+1 queries by
 * batching vote count retrieval for all polls at once.
 *
 * @returns {Promise<{polls?: any[], error?: string}>}
 *   Array of poll objects with options and vote counts, or error message
 */
export async function getPolls() {
  try {
    const supabase = await createClient();

    // Fetch polls with their options in a single query
    const { data: polls, error } = await supabase
      .from("polls")
      .select(`
        *,
        poll_options (*)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching polls:", error);
      return { error: "Failed to fetch polls" };
    }

    if (!polls || polls.length === 0) {
      return { polls: [] };
    }

    // Efficiently get vote counts for all polls in one query
    const pollIds = polls.map(poll => poll.id);
    const voteCountMap = await getVoteCounts(supabase, pollIds);

    // Enrich polls with vote count data
    const pollsWithVotes = polls.map(poll => ({
      ...poll,
      total_votes: voteCountMap.get(poll.id) || 0
    }));

    return { polls: pollsWithVotes };
  } catch (error) {
    console.error("Unexpected error fetching polls:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Retrieves a single poll by its ID with full details.
 *
 * This function fetches a specific poll for detailed view, including:
 * 1. Poll metadata and configuration
 * 2. All associated voting options
 * 3. Active status verification
 *
 * Used for individual poll pages where users view details and vote.
 *
 * @param {string} id - UUID of the poll to retrieve
 * @returns {Promise<{poll?: any, error?: string}>}
 *   Poll object with options, or error message if not found
 */
export async function getPollById(id: string) {
  try {
    const supabase = await createClient();

    const { data: poll, error } = await supabase
      .from("polls")
      .select(`
        *,
        poll_options (*)
      `)
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching poll:", error);
      return { error: "Poll not found" };
    }

    return { poll };
  } catch (error) {
    console.error("Unexpected error fetching poll:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Retrieves all polls created by the currently authenticated user.
 *
 * This function provides users with access to their own polls for management,
 * including editing and deletion. It includes poll options but not vote counts
 * since the focus is on poll management rather than results viewing.
 *
 * @returns {Promise<{polls?: any[], error?: string}>}
 *   Array of user's polls with options, or error message if unauthorized
 */
export async function getUserPolls() {
  try {
    const { supabase, user, error: userError } = await getAuthenticatedUser();

    if (userError || !user) {
      return { error: "You must be logged in to view your polls" };
    }

    const { data: polls, error } = await supabase
      .from("polls")
      .select(`
        *,
        poll_options (*)
      `)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user polls:", error);
      return { error: "Failed to fetch your polls" };
    }

    return { polls: polls || [] };
  } catch (error) {
    console.error("Unexpected error fetching user polls:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Deletes a poll and all associated data (options and votes).
 *
 * This function performs a cascading delete that removes:
 * 1. The poll record
 * 2. All associated poll options (via foreign key cascade)
 * 3. All votes on those options (via foreign key cascade)
 *
 * Includes ownership verification to ensure users can only delete their own polls.
 * Revalidates relevant pages to update the UI immediately.
 *
 * @param {string} pollId - UUID of the poll to delete
 * @returns {Promise<{success?: boolean, error?: string}>}
 *   Success confirmation or error message
 */
export async function deletePoll(pollId: string) {
  try {
    const { supabase, user, error: userError } = await getAuthenticatedUser();

    if (userError || !user) {
      return { error: "You must be logged in to delete a poll" };
    }

    // Security check: verify the user owns this poll
    const ownershipCheck = await verifyPollOwnership(supabase, pollId, user.id);
    if (ownershipCheck.error) {
      return { error: ownershipCheck.error };
    }

    // Perform cascading delete - database constraints handle related records
    const { error: deleteError } = await supabase
      .from("polls")
      .delete()
      .eq("id", pollId);

    if (deleteError) {
      console.error("Error deleting poll:", deleteError);
      return { error: "Failed to delete poll" };
    }

    // Update cached pages to reflect the deletion
    revalidatePath("/polls");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting poll:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Updates an existing poll with new form data.
 *
 * This function handles the complex process of updating polls while preserving:
 * 1. Poll ownership and security
 * 2. Existing vote relationships when options are modified
 * 3. Data consistency across poll and option updates
 *
 * The update process involves separate operations for the poll metadata
 * and options, with proper error handling and rollback considerations.
 *
 * @param {string} pollId - UUID of the poll to update
 * @param {CreatePollFormData} formData - Updated poll data from the edit form
 * @returns {Promise<{success?: boolean, error?: string}>}
 *   Success confirmation or detailed error message
 */
export async function updatePoll(pollId: string, formData: CreatePollFormData) {
  try {
    const { supabase, user, error: userError } = await getAuthenticatedUser();

    if (userError || !user) {
      return { error: "You must be logged in to update a poll" };
    }

    // Security verification: ensure user owns the poll
    const ownershipCheck = await verifyPollOwnership(supabase, pollId, user.id);
    if (ownershipCheck.error) {
      return { error: ownershipCheck.error };
    }

    // Validate and sanitize input data
    if (!formData.title.trim()) {
      return { error: "Poll title is required" };
    }

    const optionsValidation = validatePollOptions(formData.options);
    if (!optionsValidation.isValid) {
      return { error: optionsValidation.error };
    }

    const validOptions = optionsValidation.validOptions!;

    // Update poll metadata
    const pollData = {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      expires_at: formData.expiresAt?.toISOString() || null,
      is_public: formData.isPublic,
      updated_at: new Date().toISOString(),
    };

    const { error: pollUpdateError } = await supabase
      .from("polls")
      .update(pollData)
      .eq("id", pollId);

    if (pollUpdateError) {
      console.error("Error updating poll:", pollUpdateError);
      return { error: "Failed to update poll. Please try again." };
    }

    // Update poll options with complex synchronization logic
    await updatePollOptions(supabase, pollId, validOptions);

    // Revalidate all affected pages to show updates immediately
    revalidatePath(`/polls/${pollId}`);
    revalidatePath("/polls");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating poll:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." };
  }
}

/**
 * Records a user's vote on a specific poll option.
 *
 * This function implements comprehensive voting validation including:
 * 1. User authentication verification
 * 2. Poll existence and active status checks
 * 3. Expiration date validation
 * 4. Option validity (belongs to the poll)
 * 5. Duplicate vote prevention (one vote per user per poll)
 * 6. Database integrity through transaction-like error handling
 *
 * The function ensures voting integrity while providing clear error messages
 * for various failure scenarios.
 *
 * @param {string} pollId - UUID of the poll being voted on
 * @param {string} optionId - UUID of the selected poll option
 * @returns {Promise<{success?: boolean, error?: string}>}
 *   Success confirmation or specific error message explaining why voting failed
 */
export async function voteOnPoll(pollId: string, optionId: string) {
  try {
    const { supabase, user, error: userError } = await getAuthenticatedUser();

    if (userError || !user) {
      return { error: "You must be logged in to vote" };
    }

    // Verify poll exists and is eligible for voting
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("is_active, expires_at")
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      return { error: "Poll not found" };
    }

    if (!poll.is_active) {
      return { error: "This poll is no longer active" };
    }

    // Check expiration status
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return { error: "This poll has expired" };
    }

    // Validate that the selected option belongs to this poll
    const { data: option, error: optionError } = await supabase
      .from("poll_options")
      .select("id")
      .eq("id", optionId)
      .eq("poll_id", pollId)
      .single();

    if (optionError || !option) {
      return { error: "Invalid option" };
    }

    // Prevent duplicate voting - check if user already voted on this poll
    const { data: existingVote, error: voteCheckError } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    if (voteCheckError && voteCheckError.code !== "PGRST116") {
      console.error("Error checking existing vote:", voteCheckError);
      return { error: "Failed to check voting status" };
    }

    if (existingVote) {
      return { error: "You have already voted on this poll" };
    }

    // Record the vote in the database
    const { error: voteError } = await supabase
      .from("votes")
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id,
      });

    if (voteError) {
      console.error("Error inserting vote:", voteError);
      return { error: "Failed to submit your vote" };
    }

    // Update the poll page cache to show new vote immediately
    revalidatePath(`/polls/${pollId}`);

    return { success: true };
  } catch (error) {
    console.error("Unexpected error voting:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Checks if a specific user has already voted on a given poll.
 *
 * This utility function is used to prevent duplicate voting and to show
 * appropriate UI states (e.g., disabling voting buttons for users who
 * have already voted). It uses a lightweight query that only checks for
 * the existence of a vote record.
 *
 * @param {string} pollId - UUID of the poll to check voting status for
 * @param {string} userId - UUID of the user to check voting status for
 * @returns {Promise<boolean>} True if the user has voted, false otherwise
 */
export async function hasUserVoted(pollId: string, userId: string) {
  try {
    const supabase = await createClient();

    const { data: vote, error } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", userId)
      .single();

    // Handle "no rows found" as a non-error case (user hasn't voted)
    if (error && error.code !== "PGRST116") {
      console.error("Error checking vote status:", error);
      return false;
    }

    return !!vote;
  } catch (error) {
    console.error("Unexpected error checking vote status:", error);
    return false;
  }
}
