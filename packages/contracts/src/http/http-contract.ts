import { commentContract } from "./comments/comment-contract";
import { postContract } from "./posts/post-contract";
import { profileContract } from "./profile/profile-contract";

export const httpContract = {
  posts: postContract,
  profile: profileContract,
  comment: commentContract,
};
