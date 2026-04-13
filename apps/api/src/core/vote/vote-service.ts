import { voteSchema } from "@pinpoint/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "../../database/database";

const VoteSchema = voteSchema;

const VoteSchemaMongoose = toMongooseSchema(
  VoteSchema.mongoose({
    schemaOptions: {
      collection: "votes",
      versionKey: false,
    },
  })
);

export interface IVoteSchemaMongoose extends z.infer<typeof VoteSchema> {}

export const VoteService = databaseConnection.model<IVoteSchemaMongoose>("votes", VoteSchemaMongoose, "votes");
