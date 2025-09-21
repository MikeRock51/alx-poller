"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, MessageCircle, Reply } from "lucide-react";
import { createComment } from "@/lib/actions/comments";
import type { Comment, CreateCommentFormData } from "@/types";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormProps {
  pollId: string;
  parentId?: string;
  onCommentAdded?: (comment: Comment) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  userId?: string;
}

export function CommentForm({
  pollId,
  parentId,
  onCommentAdded,
  onCancel,
  placeholder = "Share your thoughts...",
  autoFocus = false,
  userId
}: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  const onSubmit = async (data: CommentFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData: CreateCommentFormData = {
        content: data.content,
        pollId,
        parentId,
      };

      if (!userId) {
        setError("You must be logged in to comment.");
        setIsSubmitting(false);
        return;
      }

      const { comment, error } = await createComment(formData, userId);

      if (error) {
        setError(error);
      } else if (comment && onCommentAdded) {
        onCommentAdded(comment);
        reset();
        if (onCancel) onCancel();
      }
    } catch (_err) {
      setError("Failed to submit comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReply = !!parentId;

  return (
    <Card className={`border-0 shadow-sm ${isReply ? 'bg-gray-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              <MessageCircle className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <Textarea
                {...register("content")}
                placeholder={placeholder}
                autoFocus={autoFocus}
                disabled={isSubmitting}
                className={`min-h-[80px] resize-none ${errors.content ? "border-red-500" : ""}`}
                maxLength={1000}
              />

              {errors.content && (
                <p className="text-sm text-red-600">{errors.content.message}</p>
              )}

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {isReply && <Reply className="h-3 w-3 inline mr-1" />}
                  Max 1000 characters
                </div>

                <div className="flex gap-2">
                  {onCancel && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onCancel}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  )}

                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || !isDirty}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                    {isReply ? "Reply" : "Comment"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
