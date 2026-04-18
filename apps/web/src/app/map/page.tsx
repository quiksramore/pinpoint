"use client";

import { useQuery } from "@tanstack/react-query";
import { Annotation, Map as MapKitMap } from "mapkit-react";
import Image from "next/image";
import { env } from "../../env";
import { webClientORPC } from "../../lib/orpc-web-client";
import Header from "../_components/header";
import PostDialog from "../feed/_components/post/post-dialog";

const CLUSTERING_ID = "pinpoint";

export default function Page() {
  const { data: posts } = useQuery(webClientORPC.posts.getAllPosts.queryOptions());

  return (
    <div className="flex h-dvh flex-col overflow-auto bg-primary-900">
      <Header defaultValue="map" className="bg-primary-900" />
      <div className="flex w-full flex-1 flex-col rounded-2xl">
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
                <div className="h-16 w-16 overflow-hidden rounded-full border-3 border-white bg-white">
                  <Image
                    src={`${env.NEXT_PUBLIC_CLOUDFLARE_PUBLIC_DEVELOPMENT_URL}/${post.images[0]?.suburl}`}
                    alt={post.caption}
                    width={256}
                    height={256}
                    className="h-full w-full object-cover"
                  />
                </div>
              </Annotation>
            </div>
          ))}
        </MapKitMap>
      </div>
    </div>
  );
}
