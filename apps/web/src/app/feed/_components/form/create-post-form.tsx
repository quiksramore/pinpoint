"use client";
import { uiCreatePostFormSchema } from "@pinpoint/contracts";
import { Button } from "@pinpoint/shad-ui/components/button";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import CaptionField from "./fields/caption-field";
import ImagesField from "./fields/images-field";
import TitleField from "./fields/title-field";

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

export default function CreatePostForm() {
  const queryClient = useQueryClient();
  const createPost = useMutation(
    webClientORPC.post.createPost.mutationOptions({
      // TODO invalidate?
      // onSuccess: async (data) => {
      //   await queryClient.invalidateQueries({
      //     queryKey: webClientORPC.post.getPosts.queryOptions({ input: { authorId: userId } }).queryKey,
      //   });
      // },
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
      await createPost.mutateAsync(value);
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
      <form.AppField name="images">{(field) => <field.ImagesField />}</form.AppField>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit} className={cn("cursor-pointer", !canSubmit && "cursor-not-allowed")}>
            {isSubmitting ? "Creating..." : "Create Post"}
          </Button>
        )}
      </form.Subscribe>
      {/* <form.Subscribe>
        <pre>{JSON.stringify(form.state, null, 2)}</pre>
      </form.Subscribe> */}
    </form>
  );
}
