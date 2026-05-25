import { formatInTimeZone } from "date-fns-tz";
import { env } from "../config/env.js";

export function nowInUlaanbaatar(): Date {
  return new Date(
    formatInTimeZone(new Date(), env.TZ, "yyyy-MM-dd'T'HH:mm:ssXXX")
  );
}

export function currentHourInUlaanbaatar(): number {
  return Number(formatInTimeZone(new Date(), env.TZ, "H"));
}

export function formatUlaanbaatar(date: Date): string {
  return formatInTimeZone(date, env.TZ, "yyyy-MM-dd HH:mm:ss");
}
