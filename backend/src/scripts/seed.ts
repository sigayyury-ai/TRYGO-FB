import mongoose from "mongoose";

import { env } from "../config/env.js";
import { seedSeoAgent } from "../services/seed/seedSeoAgent.js";
import { DEFAULT_SEED_IDS } from "./seedIds.js";

const run = async () => {
  await mongoose.connect(env.mongoUri, { dbName: "test" });

  await seedSeoAgent({
    projectId: DEFAULT_SEED_IDS.projectId,
    hypothesisId: DEFAULT_SEED_IDS.hypothesisId,
    userId: DEFAULT_SEED_IDS.userId
  });

  await mongoose.disconnect();
};

run()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("Seed completed");
    process.exit(0);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", err);
    process.exit(1);
  });
