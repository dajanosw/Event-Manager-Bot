import { Client, Events, GatewayIntentBits, SlashCommandBuilder, GuildScheduledEventManager, GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType } from 'discord.js'
import { createLogger, format, transports } from 'winston'
import fs from 'fs';
import path from 'path';

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

        // Split up the message string by Lines and double colons
        discordMessageLines = discordMessage.split("\n")
        for (let line of discordMessageLines) {
            let discordMessageParts: string[] = new Array()
            discordMessageParts = line.split(": ")

            switch(discordMessageParts[0]) {
                // In Case "New Event" create a new one-time Discord Event
                case "New Event": {
                    createNewEvent(discordMessageParts[1]!, discordMessageAttatchment)
                    break
                }
                // In Case "New Schedule" create a new Discord Event with Input
                case "New Schedule": {
                    createNewSchedule(discordMessageParts[1]!, discordMessageAttatchment)
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
function createNewEvent(eventInfo: string, discordMessageAttatchment: string): void {
    // Log the Input-Info
    logger.info("Invoking new Event: " + eventInfo)

    // Split the Event Info String into Event Details
    let eventInfoParts: string[] = new Array()
    eventInfoParts = eventInfo.split(";")
    let eventName = eventInfoParts[0]
    let startTime = eventInfoParts[1]
    let endTime = eventInfoParts[2]
    let location = eventInfoParts[3]
    let description = eventInfoParts[4]

    // Input the Info into a new Discord Event
}

/** Creates a reoccuring event from input */
function createNewSchedule(eventInfo: string, discordMessageAttatchment: string): void {
    logger.info("Invoking new Schedule: " + eventInfo)
}