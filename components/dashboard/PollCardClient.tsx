"use client";

import { useRouter } from "next/navigation";
import { PollCard } from "@/components/polls/PollCard";
import { deletePoll } from "@/lib/actions/polls";
import { useToast } from "@/lib/toast";

interface PollData {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  is_public: boolean;
  expires_at?: string;
  poll_options: Array<{
    id: string;
    option_text: string;
    display_order?: number;
  }>;
  created_by?: string;
}

interface PollCardClientProps {
  poll: PollData;
  currentUserId?: string;
  variant?: "default" | "compact" | "dashboard";
  showViewButton?: boolean;
}

export function PollCardClient({
  poll,
  currentUserId,
  variant = "default",
  showViewButton = true
}: PollCardClientProps) {
  const router = useRouter();
  const { addToast } = useToast();

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
        // Refresh the page to update the polls list
        window.location.reload();
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to delete poll",
        type: "error"
      });
    }
  };

  return (
    <PollCard
      poll={poll}
      variant={variant}
      showViewButton={showViewButton}
      currentUserId={currentUserId}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
