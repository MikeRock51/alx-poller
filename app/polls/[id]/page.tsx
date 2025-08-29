import { getPollById } from "@/lib/actions/polls";
import { PollVotingClient } from "@/components/polls/PollVotingClient";
import type { Poll } from "@/types";

interface PollDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PollDetailPage({ params }: PollDetailPageProps) {
  const { id } = await params;

  const result = await getPollById(id);

  if (result.error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-red-600 mb-4">{result.error}</div>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pollData = result.poll;
  if (!pollData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-gray-600 mb-4">Poll not found</div>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Transform the database response to match our Poll type
  const poll: Poll = {
    id: pollData.id,
    title: pollData.title,
    description: pollData.description,
    createdBy: pollData.created_by,
    createdAt: new Date(pollData.created_at),
    updatedAt: new Date(pollData.updated_at),
    expiresAt: pollData.expires_at ? new Date(pollData.expires_at) : undefined,
    isActive: pollData.is_active,
    allowMultipleVotes: pollData.allow_multiple_votes,
    isPublic: pollData.is_public,
    options: (pollData.poll_options || []).map((option: any) => ({
      id: option.id,
      pollId: option.poll_id,
      optionText: option.option_text,
      displayOrder: option.display_order,
      createdAt: new Date(option.created_at),
      votes: 0, // TODO: Calculate actual votes from votes table
    })),
    totalVotes: 0, // TODO: Calculate total votes
  };

  return <PollVotingClient poll={poll} />;
}
