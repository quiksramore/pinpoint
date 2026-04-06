"use client";
import {
  Dropzone,
  DropZoneArea,
  DropzoneDescription,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneMessage,
  DropzoneRemoveFile,
  DropzoneTrigger,
  useDropzone,
} from "@pinpoint/shad-ui/components/dropzone";
import { CloudUploadIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

type MultiImagesProps = {
  value: File[]; // form field value
  onChange: (files: File[]) => void; // update form field
};

export function MultiImages({ value, onChange }: MultiImagesProps) {
  const valueRef = useRef<File[]>(value);
  valueRef.current = value;

  const dropzone = useDropzone({
    onDropFile: async (file: File) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onChange([...valueRef.current, file]);
      return {
        status: "success",
        result: URL.createObjectURL(file),
      };
    },
    validation: {
      accept: {
        "image/*": [".png", ".jpg", ".jpeg", ".heic"],
      },
      maxSize: 5 * 1024 * 1024,
      maxFiles: 5,
    },
  });

  return (
    <div className="not-prose flex flex-col gap-4">
      <Dropzone {...dropzone}>
        <div>
          <div className="flex justify-between">
            <DropzoneDescription>Please select up to 5 images</DropzoneDescription>
            <DropzoneMessage />
          </div>
          <DropZoneArea className="p-0">
            <DropzoneTrigger className="flex flex-col items-center gap-4 bg-transparent p-10 text-center text-sm w-full">
              <CloudUploadIcon className="size-8" />
              <div>
                <p className="font-semibold">Upload listing images</p>
                <p className="text-sm text-muted-foreground">Click here or drag and drop to upload</p>
              </div>
            </DropzoneTrigger>
          </DropZoneArea>
        </div>

        <DropzoneFileList className="grid grid-cols-3 gap-3 p-0">
          {dropzone.fileStatuses.map((file) => (
            <DropzoneFileListItem className="overflow-hidden rounded-md bg-secondary p-0 shadow-sm" key={file.id} file={file}>
              {file.status === "pending" && <div className="aspect-video animate-pulse bg-black/20" />}
              {file.status === "success" && (
                <Image
                  src={file.result} // blob URL
                  alt={`uploaded-${file.fileName}`}
                  className="aspect-video object-cover"
                  width={400} // set a width
                  height={300} // set a height
                  unoptimized // allow object URLs
                />
              )}
              <div className="flex items-center justify-between p-2 pl-4">
                <div className="min-w-0">
                  <p className="truncate text-sm">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">{(file.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <DropzoneRemoveFile
                  variant="ghost"
                  className="shrink-0 hover:outline cursor-pointer"
                  onClick={() => {
                    const fileIndex = dropzone.fileStatuses.findIndex((status) => status.id === file.id);
                    dropzone.onRemoveFile(file.id).then(undefined, () => undefined);

                    if (fileIndex === -1) {
                      return;
                    }

                    onChange(value.filter((_, index) => index !== fileIndex));
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
  );
}
