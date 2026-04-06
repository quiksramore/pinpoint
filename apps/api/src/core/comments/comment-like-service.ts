import { commentLikeSchema } from "@pinpoint/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "../../database/database";

const CommentLikeSchema = commentLikeSchema;

const commentLikeSchemaMongoose = toMongooseSchema(
  CommentLikeSchema.mongoose({
    schemaOptions: {
      collection: "comments likes",
      versionKey: false,
    },
  })
);

export interface ICommentLikeSchemaMongoose extends z.infer<typeof CommentLikeSchema> {}

export const CommentLikeService = databaseConnection.model<ICommentLikeSchemaMongoose>(
  "comment likes",
  commentLikeSchemaMongoose,
  "comment likes"
);
