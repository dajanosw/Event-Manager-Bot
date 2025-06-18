import { Client, Events, GatewayIntentBits, SlashCommandBuilder, GuildScheduledEventManager, GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType } from 'discord.js'
import { createLogger, format, transports } from 'winston'
import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';

// Create a new client with Intents for Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
})

const logDir = path.dirname(process.env.LOGFILE_PATH || '');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Create a Logger
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: process.env.LOGFILE_PATH })
    ]
})

// Confirm Login
try {
    client.once(Events.ClientReady, async (readyClient) => {
        logger.info(`Logged in as ${readyClient.user.tag}`)
    });
} catch(e) {
    logger.warn(e)
}

// Create an Event on Command
try {
    client.on(Events.MessageCreate, async (message) => {
        let discordMessage = message.content
        let discordMessageLines: string[] = new Array()
        let discordMessageAttatchment = ""
        let discordServerID = message.guild?.id

        // Split up the message string by Lines and double colons
        discordMessageLines = discordMessage.split("\n")
        for (let line of discordMessageLines) {
            let discordMessageParts: string[] = new Array()
            discordMessageParts = line.split(": ")

            switch(discordMessageParts[0]) {
                // In Case "New Event" create a new one-time Discord Event
                case "New Event": {
                    createNewEvent(discordMessageParts[1]!, discordMessageAttatchment, discordServerID!)
                    break
                }
                // In Case "New Schedule" create a new Discord Event with Input
                case "New Schedule": {
                    createNewSchedule(discordMessageParts[1]!, discordMessageAttatchment, discordServerID!)
                    break
                }
                default: {
                    logger.error("Invalid Input. Try again.")
                }
            }
        }
        
        // Execute event from Code
    })
} catch(e) {
    logger.warn(e)
}


await client.login(process.env.DISCORD_BOT_TOKEN)





/** Creates an event from input */
async function createNewEvent(eventInfo: string, discordMessageAttatchment: string, guildID: string): Promise<void> {
    // Log the Input-Info
    logger.info("Invoking new Event: " + eventInfo)

    // Split the Event Info String into Event Details
    let eventInfoParts: string[] = new Array()
    eventInfoParts = eventInfo.split("; ")

    // Catch Empty Timezone
    let eventTimezone = eventInfoParts[3]
    if(eventTimezone == ""){
        eventTimezone = "Europe/London"
    }

    let eventName:string = eventInfoParts[0]!
    let startTime = new Date(parseCustomDate(eventInfoParts[1]!, eventTimezone!)!);
    let endTime = new Date(parseCustomDate(eventInfoParts[2]!, eventTimezone!)!);
    let location = eventInfoParts[4]
    let eventDescription:string = eventInfoParts[5]!

    // Input the Info into a new Discord Event
    try {
        if(guildID == null) {
            logger.error("Could not fetch Server-ID.")
            return
        }
            
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
    } catch(e) {
        logger.error("Failed to create event: " + e)
    }
}

/** Creates a reoccuring event from input */
async function createNewSchedule(eventInfo: string, discordMessageAttatchment: string, guildID: string): Promise<void> {
    logger.info("Invoking new Schedule: " + eventInfo)
}

function parseCustomDate(dateTime: string, tz: string): Date | null {
    let regex = /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})$/;
    let match = dateTime.match(regex)
    

    if (!match) {
        throw new Error(`Invalid Date Format: ${dateTime}`)
    }

    const [_, datePart, hourStr, minuteStr] = match

    // Verwende die übergebene Zeitzone zur Interpretation der Uhrzeit
    const dt = DateTime.fromFormat(`${datePart} ${hourStr}:${minuteStr}`, 'yyyy-MM-dd HH:mm', {
        zone: tz,
    })

    if (!dt.isValid) {
        throw new Error(`Ungültige Zeit oder Zeitzone: ${dt.invalidExplanation}`)
    }

    let returnDate = new Date(dt.toUTC().toISO())

    return returnDate
}