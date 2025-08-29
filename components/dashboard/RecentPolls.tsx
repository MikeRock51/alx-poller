import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { getPolls } from "@/lib/actions/polls";
import { createClient } from "@/lib/supabase/server";
import { PollCardWrapper } from "./PollCardWrapper";

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
                <a href="/polls/create">
                  <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    Create First Poll
                  </button>
                </a>
              </>
            ) : (
              <>
                <p className="text-sm mb-4">Sign up to create polls and see what others are voting on!</p>
                <div className="flex justify-center space-x-3">
                  <a href="/auth/signup">
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                      Sign Up
                    </button>
                  </a>
                  <a href="/polls">
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                      Browse Polls
                    </button>
                  </a>
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
            <a href="/polls">
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs">
                View All
              </button>
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <PollCardWrapper
          polls={polls}
          currentUserId={user?.id}
          variant="dashboard"
          showViewButton={false}
        />
      </CardContent>
    </Card>
  );
}
