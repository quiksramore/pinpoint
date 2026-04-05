import { commentSchema } from "@pinpoint/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { protectedProcedure } from "../../libs/orpc-procedures";
import { PostService } from "../post/post-service";
import { CommentService } from "./comment-service";

export const commentRouter = {
  addComment: protectedProcedure.comment.addComment.handler(
    async ({ input, context, errors: { INTERNAL_SERVER_ERROR, NOT_FOUND, FORBIDDEN } }) => {
      const id = uuidv7();
      const postDocument = await PostService.findById(input.parentPostId);

      if (!postDocument) {
        throw NOT_FOUND({
          data: { message: `User not found with email: ${context.user.email}` },
        });
      }

      //TODO (Later): Complete FORBIDDEN error

      const commentDoc: z.input<typeof commentSchema> = {
        _id: id,
        parentPostId: input.parentPostId,
        authorSnapshot: {
          name: context.user.name,
          image: context.user.image ?? "",
        },
        parentCommentId: input.parentCommentId,
        content: input.content,
        createdAt: new Date(),
      };

      const tryParse = commentSchema.safeParse(commentDoc);

      if (!tryParse.success) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Invalid Input: ${tryParse.error.issues.map((issue) => issue.message).join(", ")}`,
          },
        });
      }

      try {
        await CommentService.insertOne(commentDoc);
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Failed to insert document by _id ${id}. ${error}`,
          },
        });
      }

      return id;
    }
  ),
  //TODO: Complete other routes
};
