import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentPolls } from "@/components/dashboard/RecentPolls";
import { createClient } from "@/lib/supabase/server";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default async function Home() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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

        {/* Recent Polls */}
        <div className="mb-16">
          <RecentPolls limit={6} />
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
