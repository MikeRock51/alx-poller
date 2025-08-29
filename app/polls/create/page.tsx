"use client";

import { useRouter } from "next/navigation";
import { CreatePollForm } from "@/components/polls/CreatePollForm";

export default function CreatePollPage() {
  const router = useRouter();

  const handleSuccess = (poll: { id: string; title: string }) => {
    // Redirect to the specific poll that was just created
    router.push(`/polls/${poll.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <CreatePollForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
