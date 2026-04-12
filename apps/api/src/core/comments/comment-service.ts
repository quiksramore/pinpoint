import { commentSchema } from "@pinpoint/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "../../database/database";

const CommentSchema = commentSchema;

const commentSchemaMongoose = toMongooseSchema(
  commentSchema.mongoose({
    schemaOptions: {
      collection: "comments",
      versionKey: false,
    },
  })
);

export interface ICommentSchemaMongoose extends z.infer<typeof CommentSchema> {}

export const CommentService = databaseConnection.model<ICommentSchemaMongoose>("comments", commentSchemaMongoose, "comments");
