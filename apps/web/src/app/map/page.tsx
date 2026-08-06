"use client";

import {
  type getMapMarkersOutputSchema,
  LATITUDE_MAX,
  LATITUDE_MIN,
  LONGITUDE_MAX,
  LONGITUDE_MIN,
  LONGITUDE_RANGE,
  MAP_MAX_ZOOM,
} from "@pinpoint/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CoordinateRegion } from "mapkit-react";
import { Annotation, ColorScheme, Map as MapKitMap } from "mapkit-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type z from "zod";
import { env } from "../../env";
import { webClientORPC } from "../../lib/orpc-web-client";
import Header from "../_components/header";
import PostDialog from "../feed/_components/post/post-dialog";

const CLUSTERING_ID = "pinpoint";
const MAP_REGION_DELTA = 0.01;
const MAP_MARKER_LIMIT = 500;
const REGION_DEBOUNCE_MS = 300;
const MIN_LONGITUDE_DELTA = 0.000_001;
const WORLD_REGION: CoordinateRegion = {
  centerLatitude: 0,
  centerLongitude: 0,
  latitudeDelta: LATITUDE_MAX - LATITUDE_MIN,
  longitudeDelta: LONGITUDE_RANGE,
};

type MapMarker = z.infer<typeof getMapMarkersOutputSchema>["markers"][number];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeLongitude(longitude: number) {
  const normalized = ((((longitude + LONGITUDE_MAX) % LONGITUDE_RANGE) + LONGITUDE_RANGE) % LONGITUDE_RANGE) - LONGITUDE_MAX;
  return normalized === LONGITUDE_MIN && longitude > 0 ? LONGITUDE_MAX : normalized;
}

function getBoundsFromRegion(region: CoordinateRegion) {
  const halfLatitudeDelta = region.latitudeDelta / 2;
  const south = clamp(region.centerLatitude - halfLatitudeDelta, LATITUDE_MIN, LATITUDE_MAX);
  const north = clamp(region.centerLatitude + halfLatitudeDelta, LATITUDE_MIN, LATITUDE_MAX);

  if (region.longitudeDelta >= LONGITUDE_RANGE) {
    return { west: LONGITUDE_MIN, south, east: LONGITUDE_MAX, north };
  }

  const halfLongitudeDelta = region.longitudeDelta / 2;
  return {
    west: normalizeLongitude(region.centerLongitude - halfLongitudeDelta),
    south,
    east: normalizeLongitude(region.centerLongitude + halfLongitudeDelta),
    north,
  };
}

function getZoomFromRegion(region: CoordinateRegion) {
  return clamp(Math.log2(LONGITUDE_RANGE / Math.max(region.longitudeDelta, MIN_LONGITUDE_DELTA)), 0, MAP_MAX_ZOOM);
}

function getPostQueryOptions(postId: string) {
  return webClientORPC.posts.getPostById.queryOptions({
    input: { id: postId },
  });
}

function MapMarkerAnnotation({
  marker,
  selectedPostId,
  onSelect,
}: {
  marker: MapMarker;
  selectedPostId: string | null;
  onSelect: (postId: string) => void;
}) {
  const queryClient = useQueryClient();
  const postQueryOptions = getPostQueryOptions(marker.postId);
  const isSelected = selectedPostId === marker.postId;
  const { data: post } = useQuery({
    ...postQueryOptions,
    enabled: isSelected,
  });

  const prefetchPost = () => {
    queryClient.prefetchQuery(postQueryOptions).catch(() => undefined);
  };

  return (
    <Annotation
      longitude={marker.location.coordinates[0]}
      latitude={marker.location.coordinates[1]}
      title={marker.title}
      accessibilityLabel={marker.title}
      animates={false}
      enabled={true}
      clusteringIdentifier={CLUSTERING_ID}
      onSelect={() => {
        onSelect(marker.postId);
        prefetchPost();
      }}
      calloutContent={
        <div className="w-80 max-w-[80vw]">
          {post ? (
            <PostDialog postData={post} />
          ) : (
            <div className="rounded-md bg-background p-4 text-center text-muted-foreground text-sm">Loading post...</div>
          )}
        </div>
      }
    >
      <div
        className="h-16 w-16 cursor-pointer overflow-hidden rounded-full border-3 border-white bg-white"
        onPointerEnter={prefetchPost}
        onPointerDown={prefetchPost}
        onFocus={prefetchPost}
      >
        <Image
          src={`${env.NEXT_PUBLIC_CLOUDFLARE_PUBLIC_DEVELOPMENT_URL}/${marker.thumbnailSuburl}`}
          alt={marker.title}
          width={256}
          height={256}
          className="h-full w-full object-cover"
        />
      </div>
    </Annotation>
  );
}

export default function Page() {
  const searchParams = useSearchParams();

  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  const initialRegion: CoordinateRegion | undefined =
    lat && lng
      ? {
          centerLatitude: Number.parseFloat(lat),
          centerLongitude: Number.parseFloat(lng),
          latitudeDelta: MAP_REGION_DELTA,
          longitudeDelta: MAP_REGION_DELTA,
        }
      : undefined;
  const [region, setRegion] = useState<CoordinateRegion>(initialRegion ?? WORLD_REGION);
  const [debouncedRegion, setDebouncedRegion] = useState<CoordinateRegion>(region);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedRegion(region);
    }, REGION_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [region]);

  const markerQueryInput = useMemo(
    () => ({
      bounds: getBoundsFromRegion(debouncedRegion),
      zoom: getZoomFromRegion(debouncedRegion),
      limit: MAP_MARKER_LIMIT,
    }),
    [debouncedRegion]
  );

  const { data: mapMarkersData } = useQuery({
    ...webClientORPC.posts.getMapMarkers.queryOptions({
      input: markerQueryInput,
    }),
    placeholderData: (previousData) => previousData,
  });

  return (
    <div className="flex h-dvh flex-col overflow-auto bg-primary-900">
      <Header defaultValue="map" />
      <div className="flex w-full flex-1 flex-col rounded-2xl">
        <MapKitMap
          token={env.NEXT_PUBLIC_MAPKIT_JS_TOKEN}
          showsUserLocation={true}
          tracksUserLocation={true}
          initialRegion={initialRegion ?? WORLD_REGION}
          maxCameraDistance={10_000_000}
          onRegionChangeEnd={setRegion}
          colorScheme={ColorScheme.Dark}
        >
          {mapMarkersData?.markers.map((marker) => (
            <MapMarkerAnnotation key={marker.postId} marker={marker} selectedPostId={selectedPostId} onSelect={setSelectedPostId} />
          ))}
        </MapKitMap>
      </div>
    </div>
  );
}
