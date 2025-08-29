import { getPolls } from "@/lib/actions/polls";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PollCard } from "@/components/polls/PollCard";
import { createClient } from "@/lib/supabase/server";
import { PollsClient } from "@/components/polls/PollsClient";

export default async function PollsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const result = await getPolls();

  if (result.error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">Error loading polls: {result.error}</div>
            <Link href="/polls/create">
              <Button>Create New Poll</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const polls: Poll[] = (result.polls || []).map((poll: any) => ({
    id: poll.id,
    title: poll.title,
    description: poll.description,
    createdBy: poll.created_by,
    createdAt: new Date(poll.created_at),
    updatedAt: new Date(poll.updated_at),
    expiresAt: poll.expires_at ? new Date(poll.expires_at) : undefined,
    isActive: poll.is_active,
    allowMultipleVotes: poll.allow_multiple_votes,
    isPublic: poll.is_public,
    options: (poll.poll_options || []).map((option: any) => ({
      id: option.id,
      pollId: option.poll_id,
      optionText: option.option_text,
      displayOrder: option.display_order,
      createdAt: new Date(option.created_at),
      votes: 0, // We'll calculate this from votes table later
    })),
    totalVotes: 0, // We'll calculate this later
  }));

  return (
    <PollsClient polls={polls} currentUserId={user?.id} />
  );
}
