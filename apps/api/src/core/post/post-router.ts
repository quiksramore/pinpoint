import { protectedProcedure } from "../../libs/orpc-procedures";

export const postRouter = {
  createPost: protectedProcedure.post.createPost.handler(({ input, context }) => {
    // TODO
  }),
};
