import { GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType, TextChannel, GuildScheduledEventRecurrenceRuleFrequency } from "discord.js"
import { logger, client } from "./mainBot"
import { parseCustomDate } from "./additionalFunctions"


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
    let eventInfoParts: string[] = new Array()
    eventInfoParts = eventInfo.split("; ")

    // Catch Empty Timezone
    let eventTimezone = eventInfoParts[3]
    if (eventTimezone == "") {
        eventTimezone = "Europe/Amsterdam"
    }

    // Define the remaining attributes
    let eventName: string = eventInfoParts[0]!
    let startTime = new Date(parseCustomDate(eventInfoParts[1]!, eventTimezone!)!)
    let endTime = new Date(parseCustomDate(eventInfoParts[2]!, eventTimezone!)!)
    let location = eventInfoParts[4]
    let eventDescription: string = eventInfoParts[5]!

    // Input the Info into a new Discord Event
    try {
        if (guildID == null) {
            logger.error("Could not fetch Server-ID.")
            return;
        }

        let null_date = new Date(0);

        let guild = await client.guilds.fetch(guildID)
        let event = await guild.scheduledEvents.create({
            name: eventName,
            scheduledStartTime: startTime,
            scheduledEndTime: endTime,
            privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
            entityType: GuildScheduledEventEntityType.External,
            entityMetadata: { location },
            description: eventDescription,
        })
        logger.info(`Event "${event.name}" created for ${startTime}`)

        if (channel && channel.isTextBased()) {
            await (channel as TextChannel).send(`Event "${event.name}" created for ${startTime}`)
        }

    } catch (e) {
        logger.error("Failed to create event: " + e)
        if (channel && channel.isTextBased()) {
            await (channel as TextChannel).send("Failed: Invalid Timezone")
        }
    }
}


/** Creates a reoccuring event from input */
export async function createNewDiscordSchedule(eventInfo: string, discordMessageAttatchment: string, guildID: string, replyChannel: string): Promise<void> {
    // Log the Input-Info
    logger.info("Invoking new Event: " + eventInfo)
    let channel = client.channels.cache.get(replyChannel)

    // Split the Event Info String into Event Details
    let eventInfoParts: string[] = new Array()
    eventInfoParts = eventInfo.split("; ")

    // Catch Empty Timezone
    let eventTimezone = eventInfoParts[3]
    if (eventTimezone == "") {
        eventTimezone = "Europe/Amsterdam"
    }

    // Define the remaining attributes
    let eventName: string = eventInfoParts[0]!
    let startTime = new Date(parseCustomDate(eventInfoParts[1]!, eventTimezone!)!)
    let endTime = new Date(parseCustomDate(eventInfoParts[2]!, eventTimezone!)!)
    let location = eventInfoParts[4]
    let eventDescription: string = eventInfoParts[5]!
    let eventInterval = eventInfoParts[6]
    let eventIntervalFrequency: number = +eventInfoParts[7]!

    // Input the Info into a new Discord Event
    try {
        if (guildID == null) {
            logger.error("Could not fetch Server-ID.")
            return
        }

        let null_date = new Date(0)

        let guild = await client.guilds.fetch(guildID)

        switch (eventInterval) {
            case "daily": {
                let event = await guild.scheduledEvents.create({
                    name: eventName,
                    scheduledStartTime: startTime,
                    scheduledEndTime: endTime,
                    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                    entityType: GuildScheduledEventEntityType.External,
                    entityMetadata: { location },
                    description: eventDescription,
                    recurrenceRule: {
                        frequency: GuildScheduledEventRecurrenceRuleFrequency.Daily,
                        interval: eventIntervalFrequency,
                        startAt: startTime,
                        byWeekday: []
                    },
                })

                logger.info(`Event "${event.name}" created for ${startTime}`)
                if (channel && channel.isTextBased()) {
                    await (channel as TextChannel).send(`Event "${event.name}" created for ${startTime}`)
                }

                break
            }
            case "weekly": {
                let event = await guild.scheduledEvents.create({
                    name: eventName,
                    scheduledStartTime: startTime,
                    scheduledEndTime: endTime,
                    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                    entityType: GuildScheduledEventEntityType.External,
                    entityMetadata: { location },
                    description: eventDescription,
                    recurrenceRule: {
                        frequency: GuildScheduledEventRecurrenceRuleFrequency.Weekly,
                        interval: eventIntervalFrequency,
                        startAt: startTime,
                        byWeekday: []
                    },
                })

                logger.info(`Event "${event.name}" created for ${startTime}`)
                if (channel && channel.isTextBased()) {
                    await (channel as TextChannel).send(`Event "${event.name}" created for ${startTime}`)
                }

                break
            }
            case "monthly": {
                let event = await guild.scheduledEvents.create({
                    name: eventName,
                    scheduledStartTime: startTime,
                    scheduledEndTime: endTime,
                    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                    entityType: GuildScheduledEventEntityType.External,
                    entityMetadata: { location },
                    description: eventDescription,
                    recurrenceRule: {
                        frequency: GuildScheduledEventRecurrenceRuleFrequency.Monthly,
                        interval: eventIntervalFrequency,
                        startAt: startTime,
                        byNWeekday: []
                    },
                })

                logger.info(`Event "${event.name}" created for ${startTime}`)
                if (channel && channel.isTextBased()) {
                    await (channel as TextChannel).send(`Event "${event.name}" created for ${startTime}`)
                }

                break
            }
            case "yearly": {
                let event = await guild.scheduledEvents.create({
                    name: eventName,
                    scheduledStartTime: startTime,
                    scheduledEndTime: endTime,
                    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                    entityType: GuildScheduledEventEntityType.External,
                    entityMetadata: { location },
                    description: eventDescription,
                    recurrenceRule: {
                        frequency: GuildScheduledEventRecurrenceRuleFrequency.Yearly,
                        interval: eventIntervalFrequency,
                        startAt: startTime,
                        byMonth: [],
                        byMonthDay: [],
                    },
                })

                logger.info(`Event "${event.name}" created for ${startTime}`)
                if (channel && channel.isTextBased()) {
                    await (channel as TextChannel).send(`Event "${event.name}" created for ${startTime}`)
                }

                break
            }
            default: {
                logger.error("Could not fetch event schedule.")
                await (channel as TextChannel).send("Failed: Schedule not valid")
            }
        }

    } catch (e) {
        logger.error("Failed to create event: " + e)
        if (channel && channel.isTextBased()) {
            await (channel as TextChannel).send("Failed: Invalid Timezone")
        }
    }
}


