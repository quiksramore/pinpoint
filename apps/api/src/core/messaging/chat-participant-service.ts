import { chatParticipantSchema } from "@pinpoint/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "../../database/database";

// Mongoose Schema Definitions for MongoDB
const ChatParticipantSchema = chatParticipantSchema;

// Use toMongooseSchema to convert Zod schema to Mongoose schema
const ChatParticipantSchemaMongoose = toMongooseSchema(
  ChatParticipantSchema.mongoose({
    schemaOptions: {
      collection: "chat_participants",
      versionKey: false,
    },
  })
);

// Infer the bland TypeScript type from Zod
export interface IChatParticipantSchemaMongoose extends z.infer<typeof ChatParticipantSchema> {}

// Type the model with IPostSchema for TypeScript autocomplete
export const ChatParticipantService = databaseConnection.model<IChatParticipantSchemaMongoose>(
  "chat_participants",
  ChatParticipantSchemaMongoose,
  "chat_participants"
);
