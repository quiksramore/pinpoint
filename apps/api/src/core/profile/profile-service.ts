import { toMongooseSchema } from "mongoose-zod";
import { profileSchema } from "node_modules/@pinpoint/contracts/src/http/profile/profile-schema";
import { databaseConnection } from "src/database/database";
import type { z } from "zod";

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
