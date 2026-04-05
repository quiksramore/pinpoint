"use client";
import { DialogDescription } from "@pinpoint/shad-ui/components/dialog";
import { useForm } from "@tanstack/react-form-nextjs";

export default function CreatePostForm() {
  const form = useForm({
    defaultValues: {
      title: "",
      content: "",
    },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    ></form>
  );
}
