import { MAX_IMAGES } from "@pinpoint/contracts";
import {
  DropZoneArea,
  Dropzone,
  DropzoneDescription,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneMessage,
  DropzoneRemoveFile,
  DropzoneTrigger,
  useDropzone,
} from "@pinpoint/shad-ui/components/dropzone";
import { FieldError } from "@pinpoint/shad-ui/components/field";
import { Label } from "@pinpoint/shad-ui/components/label";
import { CloudUploadIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { type FormInputValues, useFieldContext } from "../create-post-form";

const MAX_IMAGE_SIZE_MB = 5;
const BYTES_PER_KIB = 1024;
const BYTES_PER_MB = BYTES_PER_KIB * BYTES_PER_KIB;

type ImagesFieldProps = {
  serverError?: string | null;
  onClearServerError?: () => void;
};

export default function ImagesField({ serverError, onClearServerError }: ImagesFieldProps) {
  const field = useFieldContext<FormInputValues["images"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const errors = [...field.state.meta.errors, ...(serverError ? [{ message: serverError }] : [])];

  const dropzone = useDropzone({
    onDropFile: (file: File) => {
      if (field.state.value.length >= MAX_IMAGES) {
        return Promise.resolve({
          status: "error",
          error: `Maximum of ${MAX_IMAGES} images allowed`,
        });
      }

      onClearServerError?.();
      field.pushValue(file);

      return Promise.resolve({
        status: "success",
        result: URL.createObjectURL(file),
      });
    },
    validation: {
      accept: {
        "image/*": [".png", ".jpg", ".jpeg", ".heic"],
      },
      maxSize: MAX_IMAGE_SIZE_MB * BYTES_PER_MB,
      maxFiles: MAX_IMAGES,
    },
  });

  return (
    <div>
      <Label className="pointer-events-none">Photos</Label>

      <div className="not-prose flex flex-col gap-4">
        <Dropzone {...dropzone}>
          <div>
            <div className="flex justify-between">
              <DropzoneDescription>Please select up to 5 images</DropzoneDescription>
            </div>

            <DropZoneArea className="p-0">
              <DropzoneTrigger className="flex w-full flex-col items-center gap-4 bg-transparent p-10 text-center text-sm">
                <CloudUploadIcon className="size-8" />
                <div>
                  <p className="font-semibold">Upload images</p>
                  <p className="text-muted-foreground text-sm">Click here or drag and drop to upload</p>
                </div>
              </DropzoneTrigger>
            </DropZoneArea>

            <div className="mt-1">
              <DropzoneMessage />
              {(isInvalid || serverError) && <FieldError errors={errors} />}
            </div>
          </div>

          <DropzoneFileList className="grid grid-cols-3 gap-3 p-0">
            {dropzone.fileStatuses.map((fileStatus, index) => (
              <DropzoneFileListItem className="overflow-hidden rounded-md bg-secondary p-0 shadow-sm" key={fileStatus.id} file={fileStatus}>
                {fileStatus.status === "success" ? (
                  <Image
                    src={fileStatus.result}
                    alt={`uploaded-${fileStatus.fileName}`}
                    className="aspect-video object-cover"
                    width={2000}
                    height={1000}
                    unoptimized
                  />
                ) : (
                  <div className="aspect-video animate-pulse bg-black/20" />
                )}
                <div className="mb-2 ml-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{fileStatus.fileName}</p>
                    <p className="text-foreground/50 text-xs">{(fileStatus.file.size / BYTES_PER_MB).toFixed(2)} MB</p>
                  </div>
                  <DropzoneRemoveFile
                    variant="ghost"
                    className="shrink-0 cursor-pointer hover:outline"
                    onClick={() => {
                      onClearServerError?.();
                      dropzone.onRemoveFile(fileStatus.id).then(undefined, () => undefined);
                      field.handleChange(field.state.value.filter((_, i) => i !== index));
                    }}
                  >
                    <Trash2Icon className="size-4" />
                  </DropzoneRemoveFile>
                </div>
              </DropzoneFileListItem>
            ))}
          </DropzoneFileList>
        </Dropzone>
      </div>
    </div>
  );
}
