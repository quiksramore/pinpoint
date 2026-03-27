import { postContract } from "./posts/post-contract";
import { profileContract } from "./profile/profile-contract";

export const httpContract = {
  post: postContract,
  profile: profileContract,
};
