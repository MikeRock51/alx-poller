import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { getPolls } from "@/lib/actions/polls";
import { createClient } from "@/lib/supabase/server";
import { PollCard } from "@/components/polls/PollCard";

interface RecentPollsProps {
  limit?: number;
  showViewAll?: boolean;
}

export async function RecentPolls({ limit = 6, showViewAll = true }: RecentPollsProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const result = await getPolls();

  if (result.error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <p>Unable to load recent polls. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const polls = result.polls?.slice(0, limit) || [];

  if (polls.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Polls
          </CardTitle>
          <CardDescription>
            See what the community is voting on
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No polls yet</p>
            {user ? (
              <>
                <p className="text-sm mb-4">Be the first to create a poll and start engaging your community!</p>
                <Link href="/polls/create">
                  <Button>Create First Poll</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm mb-4">Sign up to create polls and see what others are voting on!</p>
                <div className="flex justify-center space-x-3">
                  <Link href="/auth/signup">
                    <Button>Sign Up</Button>
                  </Link>
                  <Link href="/polls">
                    <Button variant="outline">Browse Polls</Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Polls
            </CardTitle>
            <CardDescription>
              See what the community is voting on
            </CardDescription>
          </div>
          {showViewAll && (
            <Link href="/polls">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              variant="dashboard"
              showViewButton={false}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


