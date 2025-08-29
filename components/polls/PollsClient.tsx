"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PollCard } from "@/components/polls/PollCard";
import { deletePoll } from "@/lib/actions/polls";
import { useToast } from "@/lib/toast";
import type { Poll } from "@/types";

interface PollsClientProps {
  polls: Poll[];
  currentUserId?: string;
}

export function PollsClient({ polls: initialPolls, currentUserId }: PollsClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [polls, setPolls] = useState(initialPolls);

  const handleEdit = (pollId: string) => {
    router.push(`/polls/${pollId}/edit`);
  };

  const handleDelete = async (pollId: string) => {
    try {
      const result = await deletePoll(pollId);
      if (result.error) {
        addToast({
          title: "Error",
          description: result.error,
          type: "error"
        });
      } else {
        addToast({
          title: "Success",
          description: "Poll deleted successfully",
          type: "success"
        });
        // Remove the deleted poll from the local state
        setPolls(prevPolls => prevPolls.filter(poll => poll.id !== pollId));
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to delete poll",
        type: "error"
      });
    }
  };

  if (polls.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No polls yet</h2>
            <p className="text-gray-600 mb-4">Be the first to create a poll!</p>
            <Link href="/polls/create">
              <Button>Create New Poll</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                currentUserId={currentUserId}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
