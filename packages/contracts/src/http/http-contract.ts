import { commentContract } from "./comments/comment-contract";
import { postContract } from "./posts/post-contract";
import { profileContract } from "./profile/profile-contract";
import { voteContract } from "./vote/vote-contract";

export const httpContract = {
  posts: postContract,
  profile: profileContract,
  comment: commentContract,
  vote: voteContract,
};
