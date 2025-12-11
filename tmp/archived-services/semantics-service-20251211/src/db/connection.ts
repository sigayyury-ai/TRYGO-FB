import mongoose from "mongoose";

import { env } from "../config/env.js";

mongoose.set("strictQuery", true);

export const connectMongo = async (): Promise<typeof mongoose> => {
  return mongoose.connect(env.mongoUri);
};

