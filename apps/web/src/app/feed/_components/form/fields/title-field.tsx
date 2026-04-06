import { FieldError } from "@pinpoint/shad-ui/components/field";
import { Input } from "@pinpoint/shad-ui/components/input";
import { Label } from "@pinpoint/shad-ui/components/label";
import { type FormInputValues, useFieldContext } from "../create-post-form";

export default function TitleField() {
  const field = useFieldContext<FormInputValues["title"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.name} className="pointer-events-none">
        Title
      </Label>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        maxLength={30}
        placeholder="Sunny Beach..."
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}{" "}
    </div>
  );
}
