import cron from "node-cron";
import { env } from "./config/env.js";
import {
  runGenerateAndPost,
  runMeasureAndOptimize,
} from "./pipeline/dailyPipeline.js";
import { logEvent, logError } from "./utils/logger.js";

const TZ = env.TZ;

async function main(): Promise<void> {
  const command = process.argv[2];

  if (command === "pipeline") {
    await runGenerateAndPost();
    return;
  }

  if (command === "measure") {
    await runMeasureAndOptimize();
    return;
  }

  logEvent("cron.start", { timezone: TZ });

  cron.schedule(
    "0 6 * * *",
    async () => {
      try {
        await runGenerateAndPost();
      } catch (error) {
        logError("cron.generate.failed", error);
      }
    },
    { timezone: TZ }
  );

  cron.schedule(
    "0 22 * * *",
    async () => {
      try {
        await runMeasureAndOptimize();
      } catch (error) {
        logError("cron.measure.failed", error);
      }
    },
    { timezone: TZ }
  );

  logEvent("cron.scheduled", {
    generate: "06:00 ULAT",
    measure: "22:00 ULAT",
  });
}

main().catch((error) => {
  logError("app.fatal", error);
  process.exit(1);
});
