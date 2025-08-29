"use server";

import { createClient } from "@/lib/supabase/server";
import { CreatePollFormData, DatabasePoll, DatabasePollOption } from "@/types";
import { revalidatePath } from "next/cache";

export async function createPoll(formData: CreatePollFormData) {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "You must be logged in to create a poll" };
    }

    // Validate input
    if (!formData.title.trim()) {
      return { error: "Poll title is required" };
    }

    if (formData.options.length < 2) {
      return { error: "A poll must have at least 2 options" };
    }

    // Filter out empty options and ensure uniqueness
    const validOptions = formData.options
      .map(option => option.trim())
      .filter(option => option.length > 0)
      .filter((option, index, arr) => arr.indexOf(option) === index); // Remove duplicates

    if (validOptions.length < 2) {
      return { error: "A poll must have at least 2 unique, non-empty options" };
    }

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

    return { polls: polls || [] };
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
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

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
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "You must be logged in to delete a poll" };
    }

    // First check if the poll belongs to the user
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("created_by")
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      return { error: "Poll not found" };
    }

    if (poll.created_by !== user.id) {
      return { error: "You can only delete your own polls" };
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
