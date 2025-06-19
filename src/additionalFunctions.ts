import { DateTime } from "luxon";
import { logger } from "./mainBot";
import { GuildScheduledEventRecurrenceRuleWeekday } from "discord.js";
import type { EventDetails } from "./EventDetails";
import { start } from "repl";


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

/**
 * Converts a JavaScript `Date` object into a corresponding `GuildScheduledEventRecurrenceRuleWeekday` enum value.
 *
 * ### Example:
 * ```ts
 * const weekday = getWeekdayNameFromDate(new Date("2025-06-18")); 
 * // Returns: GuildScheduledEventRecurrenceRuleWeekday.Wednesday
 * ```
 *
 * @param date - A valid JavaScript `Date` object.
 * 
 * @returns A `GuildScheduledEventRecurrenceRuleWeekday` enum value corresponding to the day of the week.
 *
 * @throws Will throw an error if the `Date.getDay()` result is out of expected bounds (0–6).
 *
 * @remarks
 * - This function maps the numeric day index returned by `Date.getDay()` (0 for Sunday, 6 for Saturday)
 *   to the corresponding Discord recurrence rule weekday enum.
 * - Ensures compatibility with Discord's scheduled event recurrence system.
 *
 * @dependencies
 * Assumes `GuildScheduledEventRecurrenceRuleWeekday` enum is available in scope (typically from the Discord.js or Discord API typings).
 */
export function getWeekdayNameFromDate(date: Date): GuildScheduledEventRecurrenceRuleWeekday {
    const days: GuildScheduledEventRecurrenceRuleWeekday[] = [
        GuildScheduledEventRecurrenceRuleWeekday.Sunday,
        GuildScheduledEventRecurrenceRuleWeekday.Monday,
        GuildScheduledEventRecurrenceRuleWeekday.Tuesday,
        GuildScheduledEventRecurrenceRuleWeekday.Wednesday,
        GuildScheduledEventRecurrenceRuleWeekday.Thursday,
        GuildScheduledEventRecurrenceRuleWeekday.Friday,
        GuildScheduledEventRecurrenceRuleWeekday.Saturday,
    ]

    const day = days[date.getDay()];

    if (!day) {
        throw new Error("Invalid weekday index: " + date.getDay())
    }

    return day as GuildScheduledEventRecurrenceRuleWeekday
}

/**
 * Checks whether any required fields in an `EventDetails` object are missing or contain default/empty values.
 *
 * ### Example:
 * ```ts
 * const hasEmptyFields = eventHasEmptyValues(event);
 * // Returns: true if any required field is empty or default
 * ```
 *
 * @param eventObject - An object of type `EventDetails` to validate.
 * 
 * @returns `true` if one or more critical fields are empty, invalid, or default; otherwise, `false`.
 *
 * @remarks
 * - Compares `startTime` and `endTime` against `new Date()` to detect default dates.
 * - Assumes fields like `eventName`, `description`, `timezone`, `eventLocation`, `interval` must not be empty strings.
 * - Assumes `frequency` must be a non-zero number to be considered valid.
 * - Intended for use in pre-submission validation or integrity checks before saving or sending event data.
 *
 * @dependencies
 * - Assumes `EventDetails` type is defined and includes the relevant properties used in this function.
 */
export function eventHasEmptyValues(eventObject: EventDetails): boolean {
    if( eventObject.eventName == "" || eventObject.description == "" || eventObject.endTime == new Date() || eventObject.eventLocation == "" || eventObject.frequency == 0 || eventObject.interval == "" || eventObject.startTime == new Date() || eventObject.timezone == ""){
        return true
    }
    else {
        return false
    }
}

/**
 * Determines whether a given `Date` is in the past relative to the current system time.
 *
 * ### Example:
 * ```ts
 * const isPast = checkTimeInPast(new Date("2025-06-01T12:00:00Z"));
 * // Returns: true if the date/time is before now, false otherwise
 * ```
 *
 * @param startTime - A JavaScript `Date` object representing the time to check.
 * 
 * @returns `true` if the provided `startTime` is in the past; `false` if it is in the future.
 *
 * @remarks
 * - Uses the system’s current time (`Date.now()`) for comparison.
 * - Intended for validating scheduled events, deadlines, or ensuring future-only input.
 *
 * @dependencies
 * None
 */
export function checkTimeInPast(time: Date): boolean {
    let currentDate: Date = new Date(Date.now())
    
    if (currentDate < time) {
        return false
    }
    else {
        return true
    }
}

/**
 * Checks whether the `startTime` is greater than or equal to the `endTime`, indicating an invalid or non-chronological time range.
 *
 * ### Example:
 * ```ts
 * const isInvalid = startTimebBeforeEndTime(
 *   new Date("2025-06-20T15:00:00Z"),
 *   new Date("2025-06-20T15:00:00Z")
 * );
 * // Returns: true, because startTime is equal to endTime
 * ```
 *
 * * @param startTime - A `Date` object representing the event's start time.
 * @param endTime - A `Date` object representing the event's end time.
 * 
 * @returns `true` if `startTime` is greater than or equal to `endTime` (invalid range); `false` otherwise.
 *
 * @remarks
 * - This function is used to validate chronological order between start and end times.
 * - A return value of `true` typically means the time range should be rejected or flagged.
 *
 * @dependencies
 * None
 */
export function startTimebBeforeEndTime(startTime: Date, endTime: Date): boolean {
    return startTime >= endTime
}