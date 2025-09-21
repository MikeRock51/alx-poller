"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PollResultsChart } from "./PollResultsChart";
import { CommentList } from "./CommentList";
import type { Poll } from "@/types";

interface PollVotingClientProps {
  poll: Poll;
  hasUserVoted?: boolean;
  currentUserId?: string;
}

export function PollVotingClient({ poll, hasUserVoted = false, currentUserId }: PollVotingClientProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [voted, setVoted] = useState(hasUserVoted);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    if (!selectedOption || !poll) return;

    setIsVoting(true);
    setError(null);

    try {
      const { voteOnPoll } = await import("@/lib/actions/polls");
      const result = await voteOnPoll(poll.id, selectedOption);

      if (result.error) {
        setError(result.error);
      } else {
        setVoted(true);
        // Optionally refresh the page to show updated results
        window.location.reload();
      }
    } catch (_err) {
      setError("Failed to submit vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  };

  // Note: getVotePercentage function removed as it's no longer used with the chart component

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription className="text-lg">{poll.description}</CardDescription>
            )}
            <div className="text-sm text-gray-500">
              Created on {poll.createdAt.toLocaleDateString()} • {poll.totalVotes} votes
              {poll.expiresAt && (
                <span className="ml-2">
                  • Expires on {poll.expiresAt.toLocaleDateString()}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {!currentUserId ? (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">You need to be logged in to vote on this poll.</p>
                <a
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Sign In to Vote
                </a>
              </div>
            ) : !voted ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  {poll.options.map((option) => (
                    <label key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="poll-option"
                        value={option.id}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="flex-1">{option.optionText}</span>
                    </label>
                  ))}
                </div>
                <CommentList pollId={poll.id} />
                <Button
                  onClick={handleVote}
                  disabled={!selectedOption || isVoting || !poll.isActive}
                  className="w-full"
                >
                  {isVoting ? "Submitting..." : "Vote"}
                </Button>
                {!poll.isActive && (
                  <p className="text-sm text-red-600 text-center">
                    This poll is no longer active
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <PollResultsChart
                  options={poll.options}
                  totalVotes={poll.totalVotes}
                />
                <CommentList pollId={poll.id} />
                <div className="flex justify-center">
                  <Button
                    onClick={() => setVoted(false)}
                    variant="outline"
                    className="px-6"
                  >
                    Vote Again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
