"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createPoll } from "@/lib/actions/polls";
import { CreatePollFormData } from "@/types";
import { Plus, X } from "lucide-react";

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

interface CreatePollFormProps {
  onSuccess?: (poll: { id: string; title: string }) => void;
}

export function CreatePollForm({ onSuccess }: CreatePollFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PollFormData>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      title: "",
      description: "",
      options: ["", ""],
      isPublic: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const watchedOptions = watch("options");

  const onSubmit = async (data: PollFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createPoll({
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

      // Reset form
      setValue("title", "");
      setValue("description", "");
      setValue("options", ["", ""]);
      setValue("isPublic", true);

      if (onSuccess && result.success) {
        onSuccess({
          id: result.poll.id,
          title: result.poll.title
        });
      }
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Poll</CardTitle>
        <CardDescription>
          Create a poll to gather opinions from your community
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
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
              {errors.options?.some((error) => error?.message) && (
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

        <CardFooter className="flex justify-end gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating Poll..." : "Create Poll"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
