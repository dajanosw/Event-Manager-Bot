import { DateTime } from "luxon";
import { logger } from "./mainBot";

/**
 * Parses a custom date-time string in the format "YYYY-MM-DD HH:MM" and a specified IANA timezone,
 * converting it to a UTC-based JavaScript `Date` object in ISO 8601 format.
 *
 * ### Example:
 * ```ts
 * parseCustomDate("2025-06-18 14:30", "Europe/Berlin");
 * // Returns: Date object representing the equivalent UTC time
 * ```
 *
 * @param dateTime - A string representing the date and time in the format "YYYY-MM-DD HH:MM".
 * @param tz - A string representing the IANA timezone (e.g., "America/New_York", "Europe/Berlin").
 * 
 * @returns A `Date` object in UTC if parsing succeeds; otherwise, `null` if the format is invalid or the timezone is unrecognized.
 *
 * @remarks
 * - Uses the Luxon library for timezone-aware date parsing.
 * - Logs errors for invalid date formats or timezones using `logger.error`.
 *
 * @throws No exceptions are thrown; the function returns `null` on error.
 *
 * @dependencies
 * Requires `luxon` and a `logger` utility to be available in scope.
 */

export function parseCustomDate(dateTime: string, tz: string): Date | null {
    // Check for correct DateTime-Format 
    let regex = /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})$/;
    let match = dateTime.match(regex);
    if (!match) {
        logger.error(`Invalid Date Format: ${dateTime}`);
        return null;
    }

    // Convert into luxon-Format
    let [_, datePart, hourStr, minuteStr] = match;
    let dt = DateTime.fromFormat(`${datePart} ${hourStr}:${minuteStr}`, 'yyyy-MM-dd HH:mm', {
        zone: tz,
    });

    if (!dt.isValid) {
        logger.error(`Invalid Time or Timezone: ${dt.invalidExplanation}`);
        return null;
    }

    let returnDate = new Date(dt.toUTC().toISO());

    return returnDate;
}
