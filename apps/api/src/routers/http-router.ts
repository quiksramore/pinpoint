import { commentRouter } from "../core/comments/comment-router";
import { postRouter } from "../core/post/post-router";

export const httpRouter = {
  post: postRouter,
  comment: commentRouter,
};
