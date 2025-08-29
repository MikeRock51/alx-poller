"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, Eye, Users, MoreVertical, Edit, Trash2 } from "lucide-react";

export type PollCardVariant = "default" | "compact" | "dashboard";

interface PollOption {
  id: string;
  option_text: string;
  display_order?: number;
}

interface PollData {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  is_public: boolean;
  expires_at?: string;
  is_active?: boolean;
  poll_options: PollOption[];
  created_by?: string;
  total_votes?: number;
}

interface PollCardProps {
  poll: PollData;
  variant?: PollCardVariant;
  showViewButton?: boolean;
  className?: string;
  currentUserId?: string;
  onEdit?: (pollId: string) => void;
  onDelete?: (pollId: string) => void;
}

export function PollCard({
  poll,
  variant = "default",
  showViewButton = true,
  className = "",
  currentUserId,
  onEdit,
  onDelete
}: PollCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = currentUserId && poll.created_by === currentUserId;

  const handleDelete = async () => {
    if (!onDelete || !window.confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(poll.id);
    } catch (error) {
      console.error("Failed to delete poll:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(poll.id);
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();

  // Dashboard/compact variant styling
  if (variant === "dashboard" || variant === "compact") {
    return (
      <Card className={`h-full hover:shadow-md transition-shadow ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/polls/${poll.id}`} className="flex-1 cursor-pointer">
              <CardTitle className="text-base leading-tight line-clamp-2">
                {poll.title}
              </CardTitle>
            </Link>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!poll.is_public && (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? "Deleting..." : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
            {poll.description && (
              <CardDescription className="text-sm line-clamp-2">
                {poll.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Options preview */}
              <div className="space-y-1">
                {poll.poll_options.slice(0, 3).map((option) => (
                  <div
                    key={option.id}
                    className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded"
                  >
                    {option.option_text}
                  </div>
                ))}
                {poll.poll_options.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{poll.poll_options.length - 3} more options
                  </div>
                )}
              </div>

              {/* Meta information */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(poll.created_at)}
                </div>
                <div className="flex items-center gap-2">
                  {isExpired && (
                    <Badge variant="secondary" className="text-xs">
                      Expired
                    </Badge>
                  )}
                  {!poll.is_active && !isExpired && (
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {poll.poll_options.length} options
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
    );
  }

  // Default/full variant styling
  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription className="mt-2">{poll.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!poll.is_public && (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Options preview */}
          <div className="space-y-2">
            {poll.poll_options.slice(0, 3).map((option) => (
              <div key={option.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                <span>{option.option_text}</span>
                {poll.total_votes !== undefined && (
                  <span className="text-gray-500">0 votes</span>
                )}
              </div>
            ))}
            {poll.poll_options.length > 3 && (
              <div className="text-sm text-gray-500 text-center">
                +{poll.poll_options.length - 3} more options
              </div>
            )}
          </div>

          {/* Meta information */}
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex items-center gap-4">
              {poll.total_votes !== undefined && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{poll.total_votes} votes</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDate(poll.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isExpired && (
                <Badge variant="secondary" className="text-xs">
                  Expired
                </Badge>
              )}
              {!poll.is_active && !isExpired && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {poll.poll_options.length} options
              </Badge>
            </div>
          </div>

          {/* Action button */}
          {showViewButton && (
            <Link href={`/polls/${poll.id}`}>
              <Button variant="outline" className="w-full">
                View Poll
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
