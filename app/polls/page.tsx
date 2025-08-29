import { getPolls } from "@/lib/actions/polls";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PollCard } from "@/components/polls/PollCard";

export default async function PollsPage() {
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Polls</h1>
            <p className="text-gray-600 mt-2">Discover and participate in community polls</p>
          </div>
          <Link href="/polls/create">
            <Button>Create New Poll</Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {polls.map((poll) => {
            // Transform the poll data to match PollCard interface
            const pollCardData = {
              id: poll.id,
              title: poll.title,
              description: poll.description,
              created_at: poll.createdAt.toISOString(),
              is_public: poll.isPublic,
              expires_at: poll.expiresAt?.toISOString(),
              is_active: poll.isActive,
              poll_options: poll.options.map(option => ({
                id: option.id,
                option_text: option.optionText,
                display_order: option.displayOrder
              })),
              total_votes: poll.totalVotes
            };

            return (
              <PollCard
                key={poll.id}
                poll={pollCardData}
                variant="default"
                showViewButton={true}
              />
            );
          })}
        </div>

        {polls.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No polls yet</h2>
            <p className="text-gray-600 mb-4">Be the first to create a poll!</p>
            <Link href="/polls/create">
              <Button>Create New Poll</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
