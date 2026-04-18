"use client";

import { useQuery } from "@tanstack/react-query";
import { webClientORPC } from "../../../lib/orpc-web-client";
import PostDialog from "./post/post-dialog";

export function getTimeAgo(date: Date) {
  const diff = Date.now() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}

export function getPastelColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 85%)`;
}
export default function PostGrid() {
  const { data, isLoading, error } = useQuery(
    webClientORPC.posts.getAllPosts.queryOptions({
      input: {},
    })
  );

  return (
    <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {/* TODO: replace with skeleton posts */}
      {isLoading && <p>Loading...</p>}
      {error && <p>Error loading posts: {error.message}</p>}
      {data?.map((post) => (
        <PostDialog key={post._id} data={post} />
      ))}
    </div>
  );
}
