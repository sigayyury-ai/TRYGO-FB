import mongoose from "mongoose";

import { env } from "../config/env.js";

export const connectMongo = async (): Promise<typeof mongoose> => {
  mongoose.set("strictQuery", true);
  return mongoose.connect(env.mongoUri);
};

