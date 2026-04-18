"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { Button } from "@pinpoint/shad-ui/components/button";
import { Card, CardContent } from "@pinpoint/shad-ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@pinpoint/shad-ui/components/dialog";
import { Skeleton } from "@pinpoint/shad-ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Edit, Grid } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { authClientWeb } from "../../lib/auth-client-web";
import { webClientORPC } from "../../lib/orpc-web-client";
import Header from "../_components/header";
import PostDialog from "../feed/_components/post/post-dialog";
import EditProfileForm from "./_components/edit-profile-form";

// TODO make this page overall better + improve loading skeletons
export default function Page() {
  const { username } = useParams<{ username: string }>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: authData } = authClientWeb.useSession();
  const { data: profileData, isLoading: isProfileLoading } = useQuery(
    webClientORPC.profile.getProfileByUsername.queryOptions({
      input: { username },
    })
  );

  const { data: postsData, isLoading: isPostsLoading } = useQuery(
    webClientORPC.posts.getPostsByProfileId.queryOptions({
      enabled: !!profileData,
      input: { profileId: profileData?._id ?? "" },
    })
  );

  if (isProfileLoading) {
    return <ProfileSkeleton />;
  }

  if (!profileData) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <h1 className="font-bold text-2xl">Profile not found</h1>
        <p className="text-muted-foreground">The user @{username} does not exist.</p>
      </div>
    );
  }

  const isOwner = authData?.user?.id === profileData._id;

  return (
    <div>
      <Header defaultValue="profile" />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
          <Avatar className="h-24 w-24 border-2 border-background shadow-sm md:h-32 md:w-32">
            <AvatarImage src={profileData.image || (authData?.user?.id === profileData._id ? authData?.user?.image || undefined : undefined)} />
            <AvatarFallback className="text-2xl">{profileData.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-bold font-mono text-3xl">@{profileData.username}</h1>
              </div>
              {isOwner && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>Update your profile information here.</DialogDescription>
                    </DialogHeader>
                    <EditProfileForm profile={profileData} onSubmit={() => setIsEditDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="flex gap-6 text-sm">
              <div className="flex flex-col">
                <span className="font-bold">{profileData.postCount}</span>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Posts</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold">{profileData.followers}</span>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Followers</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold">{profileData.following}</span>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Following</span>
              </div>
            </div>

            {profileData.bio && <p className="max-w-md text-pretty">{profileData.bio}</p>}

            <div className="flex flex-wrap gap-4 text-muted-foreground text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {new Date(profileData.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-8">
          <div className="mb-6 flex items-center gap-2 font-semibold">
            <Grid className="h-4 w-4" />
            <span>Posts</span>
          </div>

          {isPostsLoading ? (
            <PostsSkeleton />
            // biome-ignore lint/style/noNestedTernary: TODO
          ) : postsData && postsData.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {postsData.map((post) => (
                <PostDialog key={post._id} postData={post} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-muted/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-background p-3 shadow-sm">
                  <Grid className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">No posts yet</p>
                {isOwner && <p className="mt-1 text-muted-foreground text-sm">Share your first pin with the world!</p>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        <Skeleton className="h-24 w-24 rounded-full md:h-32 md:w-32" />

        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>

          <div className="flex gap-6">
            {[{ key: "posts" }, { key: "followers" }, { key: "following" }].map((item) => (
              <div key={item.key} className="flex flex-col gap-2">
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-3/4 max-w-sm" />
          </div>
        </div>
      </div>

      <div className="border-t pt-8">
        <div className="mb-6 flex items-center gap-2 font-semibold">
          <Grid className="h-4 w-4" />
          <span>Posts</span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {["post-1", "post-2", "post-3", "post-4", "post-5", "post-6"].map((item) => (
            <Card key={item} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function PostsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {["post-1", "post-2", "post-3", "post-4", "post-5", "post-6"].map((item) => (
        <Card key={item} className="overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
