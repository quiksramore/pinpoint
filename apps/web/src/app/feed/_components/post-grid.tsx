"use client";

import { useQuery } from "@tanstack/react-query";
import { webClientORPC } from "../../../lib/orpc-web-client";
import FeedPost from "./post/feed-post";

export default function PostGrid() {
  const { data, isLoading, error } = useQuery(
    webClientORPC.posts.getAllPosts.queryOptions({
      input: {},
    })
  );

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {/* TODO: replace with skeleton posts */}
      {isLoading && <p>Loading...</p>}
      {data?.map((post) => (
        <FeedPost key={post._id} data={post} />
      ))}
    </div>
  );
}
