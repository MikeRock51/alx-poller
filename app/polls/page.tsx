"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { Poll } from "@/types";

// TODO: Replace with actual API call
const mockPolls: Poll[] = [
  {
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
  },
  {
    id: "2",
    title: "Which framework do you prefer?",
    description: "React vs Vue vs Angular",
    options: [
      { id: "1", text: "React", votes: 67 },
      { id: "2", text: "Vue", votes: 23 },
      { id: "3", text: "Angular", votes: 18 }
    ],
    createdBy: "user2",
    createdAt: new Date("2024-01-14"),
    isActive: true,
    totalVotes: 108
  }
];

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch polls from API
    const fetchPolls = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setPolls(mockPolls);
      setIsLoading(false);
    };

    fetchPolls();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading polls...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
          {polls.map((poll) => (
            <Card key={poll.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{poll.title}</CardTitle>
                {poll.description && (
                  <CardDescription>{poll.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {poll.options.slice(0, 3).map((option) => (
                    <div key={option.id} className="flex justify-between text-sm">
                      <span>{option.text}</span>
                      <span className="text-gray-500">{option.votes} votes</span>
                    </div>
                  ))}
                  {poll.options.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{poll.options.length - 3} more options
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>{poll.totalVotes} total votes</span>
                  <span>{poll.createdAt.toLocaleDateString()}</span>
                </div>
                <Link href={`/polls/${poll.id}`}>
                  <Button variant="outline" className="w-full">
                    View Poll
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
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
