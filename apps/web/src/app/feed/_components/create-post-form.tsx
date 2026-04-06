"use client";
import { Label } from "@pinpoint/shad-ui/components/label";
import { Input } from "@pinpoint/shad-ui/components/input";
import { Textarea } from "@pinpoint/shad-ui/components/textarea";
import { useForm } from "@tanstack/react-form-nextjs";
import { FileEntry, MultiImages } from "./image-upload";
import { Button } from "@pinpoint/shad-ui/components/button";
import { cn } from "@pinpoint/shad-ui/lib/utils";

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
      <form.Field
        name="title"
        validators={{
          onBlur: ({ value }) => value.length === 0 && "You must include a title!",
          onChange: ({ value }) => value.length >= 30 && "Title must be 30 characters or less!",
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name} className="pointer-events-none">
              Title
            </Label>
            <Input
              maxLength={30}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              id={field.name}
              name={field.name}
              value={field.state.value}
              placeholder="Sunny Beach..."
            />
            {!field.state.meta.isValid && <em className="text-destructive text-sm">{field.state.meta.errors.join(", ")}</em>}
          </div>
        )}
      </form.Field>
      <form.Field
        name="caption"
        validators={{
          onBlur: ({ value }) => value.length === 0 && "You must include a caption!",
          onChange: ({ value }) => value.length >= 500 && "Caption must be 500 characters or less!",
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name} className="pointer-events-none">
              Caption
            </Label>
            <Textarea
              onChange={(e) => {
                autoResizeTextarea(e.currentTarget);
                field.handleChange(e.target.value);
              }}
              maxLength={500}
              onInput={(e) => autoResizeTextarea(e.currentTarget)}
              onBlur={field.handleBlur}
              id={field.name}
              name={field.name}
              value={field.state.value}
              placeholder="Super cool day at the beach..."
              className="field-sizing-fixed w-full max-w-full resize-none overflow-x-hidden overflow-y-hidden"
            />
            {!field.state.meta.isValid && <em className="text-destructive text-sm">{field.state.meta.errors.join(", ")}</em>}
          </div>
        )}
      </form.Field>
      <form.Field
        name="files"
        validators={{
          onChange: ({ value }) => value.length === 0 && "Please upload at least one photo!",
        }}
      >
        {(field) => (
          <div>
            <Label className="pointer-events-none">Photos</Label>
            <MultiImages
              value={field.state.value} // form value
              onChange={field.handleChange} // update form
            />
            {!field.state.meta.isValid && <em className="text-destructive text-sm">{field.state.meta.errors.join(", ")}</em>}
          </div>
        )}
      </form.Field>
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
