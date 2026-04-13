import { postRouter } from "../core/post/post-router";
import { profileRouter } from "../core/profile/profile-router";
import { voteRouter } from "../core/vote/vote-router";

export const httpRouter = {
  posts: postRouter,
  profile: profileRouter,
  vote: voteRouter,
};
