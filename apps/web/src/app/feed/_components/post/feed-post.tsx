import type { postSchema } from "@pinpoint/contracts";
import Image from "next/image";
import type z from "zod";
export default function FeedPost({ data }: { data: z.infer<typeof postSchema> }) {
  return (
    <div className="flex flex-col items-center justify-center bg-background-800 p-10">
      <p>{data.title}</p>
      <div className="relative h-100 w-100 overflow-hidden border-5 border-background-700">
        <Image src="https://picsum.photos/seed/picsum/200/300" alt={data.title} fill className="object-cover" />
      </div>
    </div>
  );
}
