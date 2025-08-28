"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/context";
import { User, LogOut } from "lucide-react";

function Navigation() {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Poller</h1>
            </div>
            <div className="w-32 h-8 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900">Poller</h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/polls">
                  <Button variant="ghost">Browse Polls</Button>
                </Link>
                <Link href="/polls/create">
                  <Button variant="ghost">Create Poll</Button>
                </Link>
                <div className="relative group">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{user.user_metadata?.name || user.email?.split('@')[0]}</span>
                  </Button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link href="/auth/profile">
                      <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        Profile
                      </div>
                    </Link>
                    <div
                      onClick={signOut}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          {user ? (
            <>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome back, {user.user_metadata?.name || user.email?.split('@')[0]}! 👋
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Ready to create some amazing polls or check out what your community is voting on?
              </p>
              <div className="flex justify-center space-x-4">
                <Link href="/polls/create">
                  <Button size="lg" className="px-8">
                    Create New Poll
                  </Button>
                </Link>
                <Link href="/polls">
                  <Button variant="outline" size="lg" className="px-8">
                    Browse Polls
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Create Amazing Polls
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Gather opinions, make decisions, and engage your community with beautiful,
                interactive polls. Simple to create, powerful to analyze.
              </p>
              <div className="flex justify-center space-x-4">
                <Link href="/polls/create">
                  <Button size="lg" className="px-8">
                    Create Your First Poll
                  </Button>
                </Link>
                <Link href="/polls">
                  <Button variant="outline" size="lg" className="px-8">
                    Browse Polls
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-xl">Easy Creation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create polls in minutes with our intuitive interface. Add multiple options,
                descriptions, and customize your questions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-xl">Real-time Results</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Watch votes come in real-time. See live updates and analyze trends
                as your community participates.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-xl">Community Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Build engagement with your audience. Use polls for feedback,
                decisions, or just for fun interactions.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-bold text-center mb-8">Ready to get started?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-2">New to Poller?</h4>
              <p className="text-gray-600 mb-4">
                Create an account to start making polls and save your results.
              </p>
              <Link href="/auth/signup">
                <Button className="w-full">
                  Create Account
                </Button>
              </Link>
            </div>
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-2">Have an account?</h4>
              <p className="text-gray-600 mb-4">
                Sign in to manage your polls and view detailed analytics.
              </p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Poller. Built with Next.js and Shadcn/UI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
