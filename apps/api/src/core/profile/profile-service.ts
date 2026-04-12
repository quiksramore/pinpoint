import { profileSchema } from "@pinpoint/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "../../database/database";

const ProfileSchema = profileSchema;

const ProfileSchemaMongoose = toMongooseSchema(
  ProfileSchema.mongoose({
    schemaOptions: {
      collection: "profiles",
      versionKey: false,
    },
  })
);

export interface IProfileSchemaMongoose extends z.infer<typeof ProfileSchema> {}

export const ProfileService = databaseConnection.model<IProfileSchemaMongoose>("profiles", ProfileSchemaMongoose, "profiles");
