"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Poll } from "@/types";

interface PollVotingClientProps {
  poll: Poll;
}

export function PollVotingClient({ poll }: PollVotingClientProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (!selectedOption || !poll) return;

    setIsVoting(true);

    // TODO: Implement actual voting logic
    console.log("Voting for option:", selectedOption);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update local state to show results
    setHasVoted(true);
    setIsVoting(false);
  };

  const getVotePercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

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
            {!hasVoted ? (
              <div className="space-y-4">
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
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Results</h3>
                {poll.options.map((option) => (
                  <div key={option.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{option.optionText}</span>
                      <span>{option.votes} votes ({getVotePercentage(option.votes)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getVotePercentage(option.votes)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() => setHasVoted(false)}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Vote Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
