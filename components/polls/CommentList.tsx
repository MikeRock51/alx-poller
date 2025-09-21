"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Loader2 } from "lucide-react";
import { CommentForm } from "./CommentForm";
import { Comment } from "./Comment";
import { getPollComments, deleteComment } from "@/lib/actions/comments";
import type { Comment as CommentType } from "@/types";
import { useAuth } from "@/lib/auth/context";

interface CommentListProps {
  pollId: string;
  className?: string;
}

export function CommentList({ pollId, className = "" }: CommentListProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    loadComments();
  }, [pollId]);

  const loadComments = async () => {
    setLoading(true);
    setError(null);

    try {
      const { comments, error } = await getPollComments(pollId);
      if (error) {
        setError(error);
      } else {
        setComments(comments);
      }
    } catch (_err) {
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = (newComment: CommentType) => {
    // Add the new comment to the list
    setComments(prevComments => {
      // If it's a reply, find the parent and add it to the replies
      if (newComment.parentId) {
        return prevComments.map(comment => {
          if (comment.id === newComment.parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment]
            };
          }
          return comment;
        });
      } else {
        // If it's a top-level comment, add it to the root
        return [...prevComments, newComment];
      }
    });
    setShowCommentForm(false);
  };

  const handleReply = (comment: CommentType) => {
    // This could scroll to the comment and show the reply form
    console.log("Replying to comment:", comment.id);
  };

  const handleEdit = (comment: CommentType) => {
    // This could open an edit form for the comment
    console.log("Editing comment:", comment.id);
  };

  const handleDelete = async (commentId: string) => {
    try {
      if (!user?.id) {
        setError("You must be logged in to delete comments.");
        return;
      }

      const { success, error } = await deleteComment(commentId, user.id);
      if (!success) {
        setError(error || "Failed to delete comment");
      } else {
        // Update the comment as deleted in the UI
        setComments(prevComments => {
          const updateComments = (comments: CommentType[]): CommentType[] => {
            return comments.map(comment => {
              if (comment.id === commentId) {
                return { ...comment, isDeleted: true };
              }
              if (comment.replies) {
                return { ...comment, replies: updateComments(comment.replies) };
              }
              return comment;
            });
          };
          return updateComments(prevComments);
        });
      }
    } catch (_err) {
      setError("Failed to delete comment");
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading comments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Discussion ({comments.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCommentForm(!showCommentForm)}
          >
            {showCommentForm ? "Cancel" : "Add Comment"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {showCommentForm && (
          <CommentForm
            pollId={pollId}
            userId={user?.id}
            onCommentAdded={handleCommentAdded}
            onCancel={() => setShowCommentForm(false)}
            autoFocus
          />
        )}

        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts on this poll!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
