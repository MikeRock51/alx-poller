"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  MoreVertical,
  Reply,
  Edit,
  Trash2,
  Clock
} from "lucide-react";
import { CommentForm } from "./CommentForm";
import type { Comment as CommentType } from "@/types";
import { useAuth } from "@/lib/auth/context";

interface CommentProps {
  comment: CommentType;
  onReply?: (comment: CommentType) => void;
  onEdit?: (comment: CommentType) => void;
  onDelete?: (commentId: string) => void;
  depth?: number;
  maxDepth?: number;
}

export function Comment({
  comment,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
  maxDepth = 3
}: CommentProps) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(depth < maxDepth);
  const [isDeleted, setIsDeleted] = useState(comment.isDeleted);

  // Don't render deleted comments
  if (isDeleted) {
    return (
      <div className="text-gray-500 text-sm italic py-2">
        Comment deleted
      </div>
    );
  }

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = () => {
    if (onDelete && window.confirm("Are you sure you want to delete this comment?")) {
      setIsDeleted(true);
      onDelete(comment.id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isAuthor = !!user && comment.author?.id === user.id;

  return (
    <div className={`space-y-3 ${depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm">
                {comment.author?.name ? getInitials(comment.author.name) : "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {comment.author?.name || "Anonymous"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(comment.createdAt)}
                  </Badge>
                  {comment.createdAt.getTime() !== comment.updatedAt.getTime() && (
                    <Badge variant="outline" className="text-xs">
                      Edited
                    </Badge>
                  )}
                </div>

                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(comment)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">
                {comment.content}
              </p>

              <div className="flex items-center gap-4 pt-1">
                {onReply && depth < maxDepth && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="h-7 text-xs"
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplies(!showReplies)}
                    className="h-7 text-xs"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {showReplies ? "Hide" : "Show"} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </Button>
                )}
              </div>

              {showReplyForm && onReply && (
                <div className="mt-3">
                  <CommentForm
                    pollId={comment.pollId}
                    parentId={comment.id}
                    userId={user?.id}
                    authorEmail={user?.email || undefined}
                    authorName={(user?.user_metadata as any)?.name || undefined}
                    onCommentAdded={() => setShowReplyForm(false)}
                    onCancel={() => setShowReplyForm(false)}
                    placeholder={`Reply to ${comment.author?.name || "Anonymous"}...`}
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}
