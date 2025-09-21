"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Comment, CreateCommentFormData, UpdateCommentFormData } from "@/types";

// ============================================================================
// COMMENT CRUD OPERATIONS
// ============================================================================

/**
 * Get all comments for a poll with author information
 */
export async function getPollComments(pollId: string): Promise<{ comments: Comment[]; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: comments, error } = await supabase
      .from("comments")
      .select("*")
      .eq("poll_id", pollId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return { comments: [], error: "Failed to load comments" };
    }

    // Transform database records to Comment type
    const transformedComments: Comment[] = (comments || []).map((comment: any) => ({
      id: comment.id,
      pollId: comment.poll_id,
      userId: comment.user_id,
      content: comment.content,
      createdAt: new Date(comment.created_at),
      updatedAt: new Date(comment.updated_at),
      parentId: comment.parent_id || undefined,
      isDeleted: comment.is_deleted,
      author: {
        id: comment.user_id,
        email: "user@example.com", // TODO: Get actual user email from auth context
        name: "Anonymous", // TODO: Get actual user name from auth context
        createdAt: new Date(comment.created_at),
      },
    }));

    // Group comments by parent_id to create threaded structure
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create all comment objects
    transformedComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build the tree structure
    transformedComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;

      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies!.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return { comments: rootComments };
  } catch (error) {
    console.error("Unexpected error fetching comments:", error);
    return { comments: [], error: "An unexpected error occurred" };
  }
}

/**
 * Create a new comment on a poll
 */
export async function createComment(
  formData: CreateCommentFormData,
  userId: string
): Promise<{ comment?: Comment; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        poll_id: formData.pollId,
        user_id: userId,
        content: formData.content,
        parent_id: formData.parentId || null,
      })
      .select(`
        *
      `)
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return { error: "Failed to create comment" };
    }

    // Transform to Comment type
    const transformedComment: Comment = {
      id: comment.id,
      pollId: comment.poll_id,
      userId: comment.user_id,
      content: comment.content,
      createdAt: new Date(comment.created_at),
      updatedAt: new Date(comment.updated_at),
      parentId: comment.parent_id || undefined,
      isDeleted: comment.is_deleted,
      author: {
        id: comment.user_id,
        email: "user@example.com", // TODO: Get actual user email from auth context
        name: "Anonymous", // TODO: Get actual user name from auth context
        createdAt: new Date(comment.created_at),
      },
      replies: [],
    };

    // Revalidate the poll page to show the new comment
    revalidatePath(`/polls/${formData.pollId}`);

    return { comment: transformedComment };
  } catch (error) {
    console.error("Unexpected error creating comment:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update an existing comment
 */
export async function updateComment(
  commentId: string,
  formData: UpdateCommentFormData,
  userId: string
): Promise<{ comment?: Comment; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: comment, error } = await supabase
      .from("comments")
      .update({ content: formData.content })
      .eq("id", commentId)
      .eq("user_id", userId)
      .select(`
        *
      `)
      .single();

    if (error) {
      console.error("Error updating comment:", error);
      return { error: "Failed to update comment" };
    }

    if (!comment) {
      return { error: "Comment not found or you don't have permission to edit it" };
    }

    // Transform to Comment type
    const transformedComment: Comment = {
      id: comment.id,
      pollId: comment.poll_id,
      userId: comment.user_id,
      content: comment.content,
      createdAt: new Date(comment.created_at),
      updatedAt: new Date(comment.updated_at),
      parentId: comment.parent_id || undefined,
      isDeleted: comment.is_deleted,
      author: {
        id: comment.user_id,
        email: "user@example.com", // TODO: Get actual user email from auth context
        name: "Anonymous", // TODO: Get actual user name from auth context
        createdAt: new Date(comment.created_at),
      },
      replies: [],
    };

    return { comment: transformedComment };
  } catch (error) {
    console.error("Unexpected error updating comment:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Soft delete a comment (only the author can delete their own comments)
 */
export async function deleteComment(
  commentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("comments")
      .update({ is_deleted: true })
      .eq("id", commentId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting comment:", error);
      return { success: false, error: "Failed to delete comment" };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting comment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get comment count for a poll
 */
export async function getCommentCount(pollId: string): Promise<{ count: number; error?: string }> {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("poll_id", pollId)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error getting comment count:", error);
      return { count: 0, error: "Failed to get comment count" };
    }

    return { count: count || 0 };
  } catch (error) {
    console.error("Unexpected error getting comment count:", error);
    return { count: 0, error: "An unexpected error occurred" };
  }
}
