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

export type FileEntry = {
  id: string;
  file: File;
};

type MultiImagesProps = {
  value: FileEntry[];
  onChange: (files: FileEntry[]) => void;
};

export function MultiImages({ value, onChange }: MultiImagesProps) {
  const valueRef = useRef(value);
  valueRef.current = value;

  const dropzone = useDropzone({
    onDropFile: async (file: File) => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (valueRef.current.length >= 5) {
        return {
          status: "error",
          error: "Maximum of 5 images allowed",
        };
      }

      onChange([...valueRef.current, { id: crypto.randomUUID(), file }]);

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
          {dropzone.fileStatuses.map((fileStatus, index) => (
            <DropzoneFileListItem className="overflow-hidden rounded-md bg-secondary p-0 shadow-sm" key={fileStatus.id} file={fileStatus}>
              {fileStatus.status === "success" ? (
                <Image
                  src={fileStatus.result}
                  alt={`uploaded-${fileStatus.fileName}`}
                  className="aspect-video object-cover"
                  width={400}
                  height={300}
                  unoptimized
                />
              ) : (
                <div className="aspect-video animate-pulse bg-black/20" />
              )}
              <div className="flex items-center justify-between p-2 pl-4">
                <div className="min-w-0">
                  <p className="truncate text-sm">{fileStatus.fileName}</p>
                  <p className="text-xs text-muted-foreground">{(fileStatus.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <DropzoneRemoveFile
                  variant="ghost"
                  className="shrink-0 hover:outline cursor-pointer"
                  onClick={() => {
                    dropzone.onRemoveFile(fileStatus.id).then(undefined, () => undefined);
                    onChange(value.filter((_, i) => i !== index));
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
