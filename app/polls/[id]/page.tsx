"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Poll } from "@/types";

// TODO: Replace with actual API call
const mockPoll: Poll = {
  id: "1",
  title: "What's your favorite programming language?",
  description: "Help us understand the community's preferences",
  options: [
    { id: "1", text: "JavaScript", votes: 45 },
    { id: "2", text: "Python", votes: 32 },
    { id: "3", text: "TypeScript", votes: 28 },
    { id: "4", text: "Rust", votes: 15 }
  ],
  createdBy: "user1",
  createdAt: new Date("2024-01-15"),
  isActive: true,
  totalVotes: 120
};

export default function PollDetailPage() {
  const params = useParams();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    // TODO: Fetch poll by ID from API
    const fetchPoll = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setPoll(mockPoll);
      setIsLoading(false);
    };

    fetchPoll();
  }, [pollId]);

  const handleVote = async () => {
    if (!selectedOption || !poll) return;

    setIsVoting(true);

    // TODO: Implement voting logic
    console.log("Voting for option:", selectedOption);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update local state to show results
    setHasVoted(true);
    setIsVoting(false);
  };

  const getVotePercentage = (votes: number) => {
    if (!poll || poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">Loading poll...</div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">Poll not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription className="text-lg">{poll.description}</CardDescription>
            )}
            <div className="text-sm text-gray-500">
              Created on {poll.createdAt.toLocaleDateString()} • {poll.totalVotes} votes
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
                      <span className="flex-1">{option.text}</span>
                    </label>
                  ))}
                </div>
                <Button
                  onClick={handleVote}
                  disabled={!selectedOption || isVoting}
                  className="w-full"
                >
                  {isVoting ? "Submitting..." : "Vote"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Results</h3>
                {poll.options.map((option) => (
                  <div key={option.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{option.text}</span>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
