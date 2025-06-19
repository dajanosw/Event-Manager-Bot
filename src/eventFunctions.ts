import { GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType, TextChannel, GuildScheduledEventRecurrenceRuleFrequency } from "discord.js"
import { logger, client } from "./mainBot"
import { eventHasEmptyValues, getWeekdayNameFromDate, checkTimeInPast } from "./additionalFunctions"
import { extractEventdetails } from "./EventDetails"


/**
 * Creates a new scheduled Discord event using the provided event information and sends confirmation or error messages
 * to a specified reply channel.
 *
 * ### Example:
 * ```ts
 * await createNewDiscordEvent(
 *   "Event Title; 2025-06-20 18:00; 2025-06-20 20:00; Europe/Amsterdam; Zoom; A fun virtual meetup",
 *   "attachment.png",
 *   "123456789012345678",
 *   "987654321098765432"
 * );
 * ```
 *
 * @param eventInfo - A semicolon-separated string containing the event's name, start time, end time, timezone, location, and description.
 *   Format: `"Event Name; StartTime; EndTime; Timezone; Location; Description"`
 * @param discordMessageAttatchment - A string representing an attachment or media identifier (currently unused in logic).
 * @param guildID - The Discord server (guild) ID where the event should be created.
 * @param replyChannel - The channel ID where a success or error message will be sent.
 * 
 * @returns A `Promise<void>` that resolves after the event is created and the message is sent. No return value.
 *
 * @remarks
 * - Uses the `parseCustomDate` function to parse and convert the event's start and end times to UTC.
 * - If the timezone is missing from the input, defaults to `"Europe/Amsterdam"`.
 * - Sends a confirmation message to the specified reply channel upon success or failure.
 * - Logs activity and errors using `logger`.
 *
 * @throws No exceptions are thrown to the caller; errors are logged and messaged in Discord if possible.
 *
 * @dependencies
 * - Requires the `client` Discord bot instance to be available in scope.
 * - Depends on `logger` for logging, and `parseCustomDate` for date parsing.
 */

export async function createNewDiscordEvent(eventInfo: string, discordMessageAttatchment: string, guildID: string, replyChannel: string): Promise<void> {
    // Log the Input-Info
    logger.info("Invoking new Event: " + eventInfo)
    let channel = client.channels.cache.get(replyChannel)

    // Split the Event Info String into Event Details
    let eventDetails = extractEventdetails(eventInfo, "New Event")
    if(eventHasEmptyValues(await eventDetails)) {
        logger.error("Something went wrong. Please check your Event Details: " + eventInfo)
        await (channel as TextChannel).send("Something went wrong. Please check your Event Details: " + eventInfo)
        return
    }

    // Check for Start Time in the past
    if(checkTimeInPast((await eventDetails).startTime) || checkTimeInPast((await eventDetails).endTime)){
        logger.error("Start or End Time is in the past. Please retry.")
        await (channel as TextChannel).send("Start or End Time is in the past. Please retry.")
        return
    }

    // Input the Info into a new Discord Event
    try {
        if (guildID == null) {
            logger.error("Could not fetch Server-ID.")
            return;
        }

        let null_date = new Date(0);

        let guild = await client.guilds.fetch(guildID)
        let location = (await eventDetails).eventLocation

        let event = await guild.scheduledEvents.create({
            name: (await eventDetails).eventName,
            scheduledStartTime: (await eventDetails).startTime,
            scheduledEndTime: (await eventDetails).endTime,
            privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
            entityType: GuildScheduledEventEntityType.External,
            entityMetadata: { location },
            description: (await eventDetails).description,
            image: discordMessageAttatchment,
        })
        logger.info(`Event "${(await eventDetails).eventName}" created for ${(await eventDetails).startTime}`)

        if (channel && channel.isTextBased()) {
            await (channel as TextChannel).send(`Event "${(await eventDetails).eventName}" created for ${(await eventDetails).startTime}`)
        }

    } catch (e) {
        logger.error("Failed to create event: " + e)
        if (channel && channel.isTextBased()) {
            await (channel as TextChannel).send("Failed to create event: " + e)
        }
    }
}

/** Creates a reoccuring event from input */
export async function createNewDiscordSchedule(eventInfo: string, discordMessageAttatchment: string, guildID: string, replyChannel: string): Promise<void> {
    // Log the Input-Info
    logger.info("Invoking new Schedule: " + eventInfo)
    let channel = client.channels.cache.get(replyChannel)
    let frequence = ""

    // Split the Event Info String into Event Details
    let eventDetails = extractEventdetails(eventInfo, "New Schedule")
    
    // Check for empty Values
    if(eventHasEmptyValues(await eventDetails)) {
        logger.error("Something went wrong. Please check your Event Details: " + eventInfo)
        await (channel as TextChannel).send("Something went wrong. Please check your Event Details: " + eventInfo)
        return
    }

    // Check for Start Time in the past
    if(checkTimeInPast((await eventDetails).startTime) || checkTimeInPast((await eventDetails).endTime)){
        logger.error("Start or End Time is in the past. Please retry.")
        await (channel as TextChannel).send("Start or End Time is in the past. Please retry.")
        return
    }

    // Input the Info into a new Discord Event
    try {
        if (guildID == null) {
            logger.error("Could not fetch Server-ID.")
            return
        }

        let guild = await client.guilds.fetch(guildID)
        let location = (await eventDetails).eventLocation

        //create the event based on the schedule interval (daily, weekly, monthly or yearly)
        switch ((await eventDetails).interval) {
            case "daily": {
                logger.info("Try creating Daily Schedule.")
                let event = await guild.scheduledEvents.create({
                    name: (await eventDetails).eventName,
                    scheduledStartTime: (await eventDetails).startTime,
                    scheduledEndTime: (await eventDetails).endTime,
                    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                    entityType: GuildScheduledEventEntityType.External,
                    entityMetadata: { location },
                    description: (await eventDetails).description,
                    image: discordMessageAttatchment,
                    recurrenceRule: {
                        frequency: GuildScheduledEventRecurrenceRuleFrequency.Daily,
                        interval: (await eventDetails).frequency,
                        startAt: (await eventDetails).startTime.toISOString(),
                        byWeekday: []
                    },
                })

                frequence = "day"
                break
            }

            case "weekly": {
                logger.info("Try creating Weekly Schedule.")

                if((await eventDetails).frequency > 2 || (await eventDetails).frequency < 0) {
                    logger.error("Error creating weekly schedule. Interval can only be 1 or 2. Input value: " + (await eventDetails).frequency)
                    await (channel as TextChannel).send("Error creating weekly schedule. Interval can only be 1 or 2. Input Value: " + (await eventDetails).frequency)
                    return
                } 

                const weekday = getWeekdayNameFromDate((await eventDetails).startTime);
                let event = await guild.scheduledEvents.create({
                    name: (await eventDetails).eventName,
                    scheduledStartTime: (await eventDetails).startTime,
                    scheduledEndTime: (await eventDetails).endTime,
                    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                    entityType: GuildScheduledEventEntityType.External,
                    entityMetadata: { location },
                    description: (await eventDetails).description,
                    image: discordMessageAttatchment,
                    recurrenceRule: {
                        frequency: GuildScheduledEventRecurrenceRuleFrequency.Weekly,
                        interval: (await eventDetails).frequency,
                        startAt: (await eventDetails).startTime,
                        byWeekday: [weekday],
                    },
                })

                frequence = "week"
                break
            }

            case "monthly": {
                logger.info("Try creating Monthly Schedule.")
                const weekday = getWeekdayNameFromDate((await eventDetails).startTime);
                let event = await guild.scheduledEvents.create({
                    name: (await eventDetails).eventName,
                    scheduledStartTime: (await eventDetails).startTime,
                    scheduledEndTime: (await eventDetails).endTime,
                    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                    entityType: GuildScheduledEventEntityType.External,
                    entityMetadata: { location },
                    description: (await eventDetails).description,
                    image: discordMessageAttatchment,
                    recurrenceRule: {
                        frequency: GuildScheduledEventRecurrenceRuleFrequency.Monthly,
                        interval: (await eventDetails).frequency,
                        startAt: (await eventDetails).startTime,
                        byNWeekday: []
                    },
                })

                frequence = "month"
                break
            }

            case "yearly": {
                logger.info("Try creating Yearly Schedule.")
                let event = await guild.scheduledEvents.create({
                    name: (await eventDetails).eventName,
                    scheduledStartTime: (await eventDetails).startTime,
                    scheduledEndTime: (await eventDetails).endTime,
                    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                    entityType: GuildScheduledEventEntityType.External,
                    entityMetadata: { location },
                    description: (await eventDetails).description,
                    image: discordMessageAttatchment,
                    recurrenceRule: {
                        frequency: GuildScheduledEventRecurrenceRuleFrequency.Yearly,
                        interval: (await eventDetails).frequency,
                        startAt: (await eventDetails).startTime,
                        byMonth: [],
                        byMonthDay: [],
                    },
                })
                
                frequence = "year"
                break
            }

            // if none of the intervals is true, send an error message in the logs and on the server
            default: {
                logger.error("Could not fetch event schedule. Fetched Input: " + (await eventDetails).interval)
                await (channel as TextChannel).send("Failed: Schedule not valid. Input: " + (await eventDetails).interval)
                return
            }
        }
        
        logger.info(`Event "${(await eventDetails).eventName}" created for ${(await eventDetails).startTime} with schedule ${(await eventDetails).interval} repeated every ${(await eventDetails).frequency} week(s).`)
        if (channel && channel.isTextBased()) {
            await (channel as TextChannel).send(`Event "${(await eventDetails).eventName}" created for ${(await eventDetails).startTime} with schedule ${(await eventDetails).interval} repeated every ${(await eventDetails).frequency} ` + frequence + `(s).`)
        }

    } catch (e) {
        logger.error("Failed to create event: " + e)
        if (channel && channel.isTextBased()) {
            await (channel as TextChannel).send("Failed to create event: " + e)
        }
    }
}