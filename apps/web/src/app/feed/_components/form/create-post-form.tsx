"use client";
import { uiCreatePostFormSchema } from "@pinpoint/contracts";
import { Button } from "@pinpoint/shad-ui/components/button";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import CaptionField from "./fields/caption-field";
import ImagesField from "./fields/images-field";
import TitleField from "./fields/title-field";

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object") {
    const errorRecord = error as Record<string, unknown>;
    const data = errorRecord.data;

    if (data && typeof data === "object") {
      const dataMessage = (data as Record<string, unknown>).message;
      if (typeof dataMessage === "string" && dataMessage.length > 0) {
        return dataMessage;
      }
    }

    if (typeof errorRecord.message === "string" && errorRecord.message.length > 0) {
      return errorRecord.message;
    }
  }

  return "Failed to create post. Please try again.";
};

export type FormInputValues = z.input<typeof uiCreatePostFormSchema>;
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TitleField,
    CaptionField,
    ImagesField,
  },
  formComponents: {},
});

export default function CreatePostForm({ onSuccess }: { onSuccess?: () => void }) {
  const [imagesServerError, setImagesServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const createPost = useMutation(
    webClientORPC.posts.createPost.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: webClientORPC.posts.getAllPosts.queryOptions({ input: {} }).queryKey,
        });
      },
    })
  );

  const form = useAppForm({
    defaultValues: {
      title: "",
      caption: "",
      images: [],
    } as FormInputValues,
    validators: {
      onChange: uiCreatePostFormSchema,
    },
    onSubmit: async ({ value }) => {
      setImagesServerError(null);

      try {
        await createPost.mutateAsync(value);
        onSuccess?.();
      } catch (error) {
        setImagesServerError(getErrorMessage(error));
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex w-full flex-col gap-4"
    >
      <form.AppField name="title">{(field) => <field.TitleField />}</form.AppField>
      <form.AppField name="caption">{(field) => <field.CaptionField />}</form.AppField>
      <form.AppField name="images">
        {(field) => <field.ImagesField serverError={imagesServerError} onClearServerError={() => setImagesServerError(null)} />}
      </form.AppField>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit} className={cn("cursor-pointer", !canSubmit && "cursor-not-allowed")}>
            {isSubmitting ? "Creating..." : "Create Post"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
