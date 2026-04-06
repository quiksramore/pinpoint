"use client";
import { Label } from "@pinpoint/shad-ui/components/label";
import { Input } from "@pinpoint/shad-ui/components/input";
import { Textarea } from "@pinpoint/shad-ui/components/textarea";
import { useForm } from "@tanstack/react-form-nextjs";
import { FileEntry, MultiImages } from "./image-upload";
import { Button } from "@pinpoint/shad-ui/components/button";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import CaptionField from "./fields/caption-field";
import ImagesField from "./fields/images-field";
import TitleField from "./fields/title-field";

const autoResizeTextarea = (element: HTMLTextAreaElement) => {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
};

export default function CreatePostForm() {
  const form = useForm({ defaultValues: { title: "", caption: "", files: [] as FileEntry[] }, onSubmit: (values) => console.log(values.value) });
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
