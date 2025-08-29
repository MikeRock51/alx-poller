"use client";

import { useRouter } from "next/navigation";
import { CreatePollForm } from "@/components/polls/CreatePollForm";

export default function CreatePollPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect to polls list after successful creation
    router.push("/polls");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <CreatePollForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
