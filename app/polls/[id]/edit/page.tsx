"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getPollById, updatePoll } from "@/lib/actions/polls";
import { CreatePollFormData } from "@/types";
import { Plus, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

const pollSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  options: z.array(z.string().min(1, "Option cannot be empty").max(100, "Option must be less than 100 characters"))
    .min(2, "At least 2 options are required")
    .max(10, "Maximum 10 options allowed"),
  expiresAt: z.date().optional(),
  isPublic: z.boolean(),
});

type PollFormData = z.infer<typeof pollSchema>;

export default function EditPollPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PollFormData>({
    resolver: zodResolver(pollSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    // @ts-ignore - TypeScript issue with react-hook-form useFieldArray
    name: "options",
  });

  const watchedOptions = watch("options");

  useEffect(() => {
    const loadPoll = async () => {
      try {
        setIsLoading(true);
        const result = await getPollById(pollId);

        if (result.error) {
          setError(result.error);
          return;
        }

        const poll = result.poll;
        if (!poll) {
          setError("Poll not found");
          return;
        }

        // Check if user owns this poll
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in to edit polls");
          return;
        }

        setCurrentUserId(user.id);

        if (poll.created_by !== user.id) {
          setError("You can only edit your own polls");
          return;
        }

        // Populate form with existing data
        setValue("title", poll.title);
        setValue("description", poll.description || "");
        setValue("options", poll.poll_options?.map((opt: any) => opt.option_text) || ["", ""]);
        setValue("expiresAt", poll.expires_at ? new Date(poll.expires_at) : undefined);
        setValue("isPublic", poll.is_public);

      } catch (err) {
        setError("Failed to load poll");
        console.error("Error loading poll:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPoll();
  }, [pollId, setValue]);

  const onSubmit = async (data: PollFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updatePoll(pollId, {
        title: data.title,
        description: data.description,
        options: data.options,
        expiresAt: data.expiresAt,
        isPublic: data.isPublic,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      // Redirect back to the poll
      router.push(`/polls/${pollId}`);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOption = () => {
    if (fields.length < 10) {
      append("");
    }
  };

  const removeOption = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={() => router.back()}>
                    Go Back
                  </Button>
                  <Link href="/polls">
                    <Button variant="outline">
                      View All Polls
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Poll</h1>
            <p className="text-gray-600 mt-1">Make changes to your poll</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Poll Details</CardTitle>
              <CardDescription>
                Update your poll information and options
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Poll Title *</Label>
                <Input
                  id="title"
                  placeholder="What's your favorite programming language?"
                  {...register("title")}
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add more context about your poll..."
                  rows={3}
                  {...register("description")}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Options *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    disabled={fields.length >= 10}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </Button>
                </div>

                {errors.options && (
                  <p className="text-sm text-red-600">{errors.options.message}</p>
                )}

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        {...register(`options.${index}`)}
                        className={errors.options?.[index] ? "border-red-500" : ""}
                      />
                      {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {errors.options && Array.isArray(errors.options) && errors.options.some((error) => error?.message) && (
                    <div className="space-y-1">
                      {errors.options.map((error, index) => (
                        error?.message && (
                          <p key={index} className="text-sm text-red-600">
                            Option {index + 1}: {error.message}
                          </p>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Public/Private Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Poll</Label>
                  <p className="text-sm text-gray-600">
                    {watch("isPublic")
                      ? "Anyone can view and vote on this poll"
                      : "Only you can see this poll"
                    }
                  </p>
                </div>
                <Switch
                  checked={watch("isPublic")}
                  onCheckedChange={(checked) => setValue("isPublic", checked)}
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating Poll..." : "Update Poll"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
