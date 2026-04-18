import { commentRouter } from "../core/comments/comment-router";
import { chatroomRouter } from "../core/messaging/chatroom-router";
import { postRouter } from "../core/post/post-router";
import { profileRouter } from "../core/profile/profile-router";
import { voteRouter } from "../core/vote/vote-router";

export const httpRouter = {
  comment: commentRouter,
  posts: postRouter,
  profile: profileRouter,
  chatroom: chatroomRouter,
  vote: voteRouter,
};
