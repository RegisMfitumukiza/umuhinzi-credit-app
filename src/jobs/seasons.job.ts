import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { logger } from "../utils/logger.js";

type SeasonDef = {
  name: "Season A" | "Season B" | "Season C";
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  yearOffset: number; // end year = season year + offset
};

const SEASON_DEFS: SeasonDef[] = [
  { name: "Season A", startMonth: 8, startDay: 1, endMonth: 0, endDay: 31, yearOffset: 1 },
  { name: "Season B", startMonth: 1, startDay: 1, endMonth: 5, endDay: 30, yearOffset: 0 },
  { name: "Season C", startMonth: 6, startDay: 1, endMonth: 7, endDay: 31, yearOffset: 0 },
];

const buildRecords = (years: number[]) =>
  years.flatMap((year) =>
    SEASON_DEFS.map((def) => ({
      name: def.name,
      year,
      startDate: new Date(Date.UTC(year, def.startMonth, def.startDay)),
      endDate: new Date(Date.UTC(year + def.yearOffset, def.endMonth, def.endDay)),
    }))
  );

/**
 * Ensures seasons exist for the current year and the next year.
 * Safe to call repeatedly — skips any that already exist.
 */
export const ensureCurrentSeasons = async (): Promise<void> => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];

  const result = await prisma.farmingSeason.createMany({
    data: buildRecords(years),
    skipDuplicates: true,
  });

  if (result.count > 0) {
    logger.info(`Seasons: created ${result.count} new season(s) for ${years.join(", ")}.`);
  } else {
    logger.info(`Seasons: ${years.join(" & ")} already covered — nothing to create.`);
  }
};

/**
 * Cron job: runs on January 1st at 00:05 AM every year.
 * Creates the new year's three seasons + the following year as a buffer.
 */
export const startSeasonsJob = (): void => {
  cron.schedule("5 0 1 1 *", async () => {
    logger.info("Seasons job: new year detected, generating seasons...");
    try {
      await ensureCurrentSeasons();
    } catch (error) {
      logger.error("Seasons job failed", { error });
    }
  });

  logger.info("Seasons job scheduled (annually on Jan 1 at 00:05 AM)");
};
