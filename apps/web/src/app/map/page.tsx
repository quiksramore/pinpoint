"use client";

import { useQuery } from "@tanstack/react-query";
import { Annotation, Map as MapKitMap } from "mapkit-react";
import Image from "next/image";
import { env } from "../../env";
import { webClientORPC } from "../../lib/orpc-web-client";
import PostDialog from "../feed/_components/post/post-dialog";

const CLUSTERING_ID = "pinpoint";

export default function Page() {
  const { data: posts } = useQuery(webClientORPC.posts.getAllPosts.queryOptions());

  // const mapkit = await load({
  //   token: env.NEXT_PUBLIC_MAPKIT_JS_TOKEN,
  //   language: "en-US",
  //   libraries: ["services", "full-map", "geojson"],
  // });

  return (
    <div
      // style={{ width: "80%", height: "900px", display: "flex" }}
      className="flex h-full w-1/2 p-20"
    >
      <MapKitMap token={env.NEXT_PUBLIC_MAPKIT_JS_TOKEN} showsUserLocation={true}>
        {posts?.map((post) => (
          <div key={post._id}>
            <Annotation
              longitude={post.location.coordinates[0]}
              latitude={post.location.coordinates[1]}
              animates={false}
              enabled={true}
              clusteringIdentifier={CLUSTERING_ID}
              calloutContent={
                <div>
                  <PostDialog postData={post} />
                </div>
              }
            >
              <Image
                className="rounded-full border-3 border-white bg-white"
                src={`${env.NEXT_PUBLIC_CLOUDFLARE_PUBLIC_DEVELOPMENT_URL}/${post.images[0]?.suburl}`}
                height={64}
                width={64}
                alt={post.caption}
              />
            </Annotation>
          </div>
        ))}
      </MapKitMap>
    </div>
  );
}
