import { communityContract } from "./community-contract";
import { counterContract } from "./counter-contract";
import { postContract } from "./post-contract";

export const httpContract = {
  counter: counterContract,
  post: postContract,
  community: communityContract,
};
