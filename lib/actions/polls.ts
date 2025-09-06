"use server";

import { createClient } from "@/lib/supabase/server";
import { CreatePollFormData, DatabasePoll, DatabasePollOption } from "@/types";
import { revalidatePath } from "next/cache";

// Helper Functions
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  return { supabase, user, error };
}

function validatePollOptions(options: string[]): { isValid: boolean; error?: string; validOptions?: string[] } {
  if (options.length < 2) {
    return { isValid: false, error: "A poll must have at least 2 options" };
  }

  const validOptions = options
    .map(option => option.trim())
    .filter(option => option.length > 0)
    .filter((option: string, index: number, arr: string[]) => arr.indexOf(option) === index);

  if (validOptions.length < 2) {
    return { isValid: false, error: "A poll must have at least 2 unique, non-empty options" };
  }

  return { isValid: true, validOptions };
}

async function getVoteCounts(supabase: any, pollIds: string[]) {
  if (pollIds.length === 0) return new Map();

  const { data: votes } = await supabase
    .from("votes")
    .select("poll_id")
    .in("poll_id", pollIds);

  const voteCountMap = new Map<string, number>();
  votes?.forEach((vote: any) => {
    const count = voteCountMap.get(vote.poll_id) || 0;
    voteCountMap.set(vote.poll_id, count + 1);
  });

  return voteCountMap;
}

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

async function updatePollOptions(supabase: any, pollId: string, validOptions: string[]) {
  const { data: existingOptions } = await supabase
    .from("poll_options")
    .select("id, option_text")
    .eq("poll_id", pollId);

  // Update existing options and add new ones
  for (let i = 0; i < validOptions.length; i++) {
    const optionText = validOptions[i];

    if (existingOptions && i < existingOptions.length) {
      // Update existing option
      const { error: optionError } = await supabase
        .from("poll_options")
        .update({ option_text: optionText })
        .eq("id", existingOptions[i].id);

      if (optionError) {
        throw new Error("Failed to update poll options");
      }
    } else {
      // Add new option
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

  // Remove excess options if any
  if (existingOptions && existingOptions.length > validOptions.length) {
    const optionsToDelete = existingOptions
      .slice(validOptions.length)
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

export async function createPoll(formData: CreatePollFormData) {
  try {
    const { supabase, user, error: userError } = await getAuthenticatedUser();

    if (userError || !user) {
      return { error: "You must be logged in to create a poll" };
    }

    // Validate input
    if (!formData.title.trim()) {
      return { error: "Poll title is required" };
    }

    const optionsValidation = validatePollOptions(formData.options);
    if (!optionsValidation.isValid) {
      return { error: optionsValidation.error };
    }

    const validOptions = optionsValidation.validOptions!;

    // Create poll
    const pollData = {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      created_by: user.id,
      expires_at: formData.expiresAt?.toISOString() || null,
      is_public: formData.isPublic,
      allow_multiple_votes: false, // For now, single vote per poll
    };

    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert(pollData)
      .select()
      .single();

    if (pollError) {
      console.error("Error creating poll:", pollError);
      return { error: "Failed to create poll. Please try again." };
    }

    // Create poll options
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
      // If options creation fails, we should delete the poll to maintain consistency
      await supabase.from("polls").delete().eq("id", poll.id);
      return { error: "Failed to create poll options. Please try again." };
    }

    // Revalidate the polls page to show the new poll
    revalidatePath("/polls");

    return { success: true, poll };
  } catch (error) {
    console.error("Unexpected error creating poll:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function getPolls() {
  try {
    const supabase = await createClient();

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

    // Get vote counts efficiently
    const pollIds = polls.map(poll => poll.id);
    const voteCountMap = await getVoteCounts(supabase, pollIds);

    // Add vote counts to polls
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

export async function deletePoll(pollId: string) {
  try {
    const { supabase, user, error: userError } = await getAuthenticatedUser();

    if (userError || !user) {
      return { error: "You must be logged in to delete a poll" };
    }

    // Verify poll ownership
    const ownershipCheck = await verifyPollOwnership(supabase, pollId, user.id);
    if (ownershipCheck.error) {
      return { error: ownershipCheck.error };
    }

    // Delete the poll (cascade will handle poll_options and votes)
    const { error: deleteError } = await supabase
      .from("polls")
      .delete()
      .eq("id", pollId);

    if (deleteError) {
      console.error("Error deleting poll:", deleteError);
      return { error: "Failed to delete poll" };
    }

    // Revalidate the polls pages
    revalidatePath("/polls");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting poll:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function updatePoll(pollId: string, formData: CreatePollFormData) {
  try {
    const { supabase, user, error: userError } = await getAuthenticatedUser();

    if (userError || !user) {
      return { error: "You must be logged in to update a poll" };
    }

    // Verify ownership
    const ownershipCheck = await verifyPollOwnership(supabase, pollId, user.id);
    if (ownershipCheck.error) {
      return { error: ownershipCheck.error };
    }

    // Validate input
    if (!formData.title.trim()) {
      return { error: "Poll title is required" };
    }

    const optionsValidation = validatePollOptions(formData.options);
    if (!optionsValidation.isValid) {
      return { error: optionsValidation.error };
    }

    const validOptions = optionsValidation.validOptions!;

    // Update poll
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

    // Update options
    await updatePollOptions(supabase, pollId, validOptions);

    // Revalidate the poll pages
    revalidatePath(`/polls/${pollId}`);
    revalidatePath("/polls");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating poll:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." };
  }
}

export async function voteOnPoll(pollId: string, optionId: string) {
  try {
    const { supabase, user, error: userError } = await getAuthenticatedUser();

    if (userError || !user) {
      return { error: "You must be logged in to vote" };
    }

    // Check if the poll exists and is active
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

    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return { error: "This poll has expired" };
    }

    // Check if the option belongs to the poll
    const { data: option, error: optionError } = await supabase
      .from("poll_options")
      .select("id")
      .eq("id", optionId)
      .eq("poll_id", pollId)
      .single();

    if (optionError || !option) {
      return { error: "Invalid option" };
    }

    // Check if user has already voted on this poll
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

    // Insert the vote
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

    // Revalidate the poll page to show updated results
    revalidatePath(`/polls/${pollId}`);

    return { success: true };
  } catch (error) {
    console.error("Unexpected error voting:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function hasUserVoted(pollId: string, userId: string) {
  try {
    const supabase = await createClient();

    const { data: vote, error } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", userId)
      .single();

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
