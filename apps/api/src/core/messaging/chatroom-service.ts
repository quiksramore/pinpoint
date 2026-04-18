import { chatroomSchema } from "@pinpoint/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "../../database/database";

// Mongoose Schema Definitions for MongoDB
const ChatRoomSchema = chatroomSchema;

// Use toMongooseSchema to convert Zod schema to Mongoose schema
const ChatRoomSchemaMongoose = toMongooseSchema(
  ChatRoomSchema.mongoose({
    schemaOptions: {
      collection: "chatrooms",
      versionKey: false,
    },
  })
);

// Infer the bland TypeScript type from Zod
export interface IChatRoomSchemaMongoose extends z.infer<typeof ChatRoomSchema> {}

// Type the model with IPostSchema for TypeScript autocomplete
export const ChatRoomService = databaseConnection.model<IChatRoomSchemaMongoose>("chatrooms", ChatRoomSchemaMongoose, "chatrooms");
