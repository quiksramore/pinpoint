import { FieldError } from "@pinpoint/shad-ui/components/field";
import { Label } from "@pinpoint/shad-ui/components/label";
import { Textarea } from "@pinpoint/shad-ui/components/textarea";
import { type FormInputValues, useFieldContext } from "../create-post-form";

export default function CaptionField() {
  const field = useFieldContext<FormInputValues["caption"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.name} className="pointer-events-none">
        Caption
      </Label>
      <Textarea
        className="w-full max-w-full overflow-x-hidden overflow-y-hidden"
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => {
          field.handleChange(e.target.value);
        }}
        placeholder="Super cool day at the beach..."
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </div>
  );
}
