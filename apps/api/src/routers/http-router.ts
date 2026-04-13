import { postRouter } from "../core/post/post-router";
import { profileRouter } from "../core/profile/profile-router";

export const httpRouter = {
  posts: postRouter,
  profile: profileRouter,
};
