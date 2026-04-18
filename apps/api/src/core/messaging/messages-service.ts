import { messageSchema } from "@pinpoint/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "../../database/database";

// Mongoose Schema Definitions for MongoDB
const MessageSchema = messageSchema;

// Use toMongooseSchema to convert Zod schema to Mongoose schema
const MessageSchemaMongoose = toMongooseSchema(
  MessageSchema.mongoose({
    schemaOptions: {
      collection: "messages",
      versionKey: false,
    },
  })
);

// Infer the bland TypeScript type from Zod
export interface IMessageSchemaMongoose extends z.infer<typeof MessageSchema> {}

// Type the model with IPostSchema for TypeScript autocomplete
export const MessageService = databaseConnection.model<IMessageSchemaMongoose>("messages", MessageSchemaMongoose, "messages");
