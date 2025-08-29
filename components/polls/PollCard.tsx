import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, Users } from "lucide-react";

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
}

export function PollCard({
  poll,
  variant = "default",
  showViewButton = true,
  className = ""
}: PollCardProps) {
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
      <Link href={`/polls/${poll.id}`}>
        <Card className={`h-full hover:shadow-md transition-shadow cursor-pointer ${className}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-tight line-clamp-2">
                {poll.title}
              </CardTitle>
              {!poll.is_public && (
                <Eye className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
              )}
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
      </Link>
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
          {!poll.is_public && (
            <Eye className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
          )}
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
