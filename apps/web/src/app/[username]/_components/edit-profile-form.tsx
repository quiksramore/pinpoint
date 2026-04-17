import { type profileSchema, uiEditProfileFormSchema, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from "@pinpoint/contracts";
import { Button } from "@pinpoint/shad-ui/components/button";
import { DialogFooter } from "@pinpoint/shad-ui/components/dialog";
import { FieldError } from "@pinpoint/shad-ui/components/field";
import { Input } from "@pinpoint/shad-ui/components/input";
import { Label } from "@pinpoint/shad-ui/components/label";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { z } from "zod";
import { webClientORPC } from "../../../lib/orpc-web-client";

export type FormInputValues = z.input<typeof uiEditProfileFormSchema>;
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    UsernameField,
    BioField,
    LocationField,
  },
  formComponents: {},
});

export default function EditProfileForm({ profile, onSubmit }: { profile: z.infer<typeof profileSchema>; onSubmit: () => void }) {
  const queryClient = useQueryClient();
  const editProfile = useMutation(webClientORPC.profile.editProfile.mutationOptions());

  // TODO: isDirty doesn't work if field is the same value as before, button becomes submittable.
  const form = useAppForm({
    defaultValues: {
      username: profile.username,
      bio: profile.bio ?? "",
    } as FormInputValues,
    validators: {
      onChange: uiEditProfileFormSchema,
    },
    onSubmit: async ({ value }) => {
      // TODO: url page needs to be reloaded with the updated username if changed.
      await editProfile.mutateAsync({
        id: profile._id,
        username: value.username,
        bio: value.bio,
      });
      await queryClient.invalidateQueries(
        { queryKey: webClientORPC.profile.getProfileById.queryOptions({ input: { id: profile._id } }) }.queryKey
      );
      onSubmit();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.AppField name="username">{(field) => <field.UsernameField />}</form.AppField>
      <form.AppField name="bio">{(field) => <field.BioField />}</form.AppField>
      <form.AppField name="location">{(field) => <field.LocationField />}</form.AppField>
      <DialogFooter>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}>
          {([canSubmit, isSubmitting, isDirty]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting || !isDirty}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </form>
  );
}

function UsernameField() {
  const field = useFieldContext<FormInputValues["username"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.name} className="pointer-events-none">
        Username
      </Label>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        minLength={USERNAME_MIN_LENGTH}
        maxLength={USERNAME_MAX_LENGTH}
        placeholder="Enter a username"
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </div>
  );
}

function BioField() {
  const field = useFieldContext<FormInputValues["bio"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.name} className="pointer-events-none">
        Bio
      </Label>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        maxLength={200}
        placeholder="Tell us about yourself..."
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </div>
  );
}

// TODO make this better, real world cities/area like Ashby's job apps.
function LocationField() {
  const field = useFieldContext<FormInputValues["location"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.name} className="pointer-events-none">
        Location
      </Label>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        maxLength={30}
        placeholder="Enter your location"
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </div>
  );
}
