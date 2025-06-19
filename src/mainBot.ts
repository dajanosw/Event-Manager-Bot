import { Client, Events, GatewayIntentBits } from 'discord.js'
import { createLogger, format, transports } from 'winston'
import fs from 'fs'
import path from 'path'
import { createNewDiscordEvent, createNewDiscordSchedule } from './eventFunctions'


// Create a new client with Intents for Discord
export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
})

// If not exists, create a LogDir and Log-File
const logDir = path.dirname(process.env.LOGFILE_PATH || '')
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Create a Logger
export const logger = createLogger({
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

// Confirm Login Once
try {
    client.once(Events.ClientReady, async (readyClient) => {
        logger.info(`Logged in as ${readyClient.user.tag}`)
    });
} catch(e) {
    logger.warn(e)
}

// Work with Input
try {
    client.on(Events.MessageCreate, async (message) => {
        let discordMessage = message.content
        let discordMessageLines: string[] = new Array()
        let discordMessageAttachment = ""
        let discordServerID = message.guild?.id
        let channelSent = message.channel.id
        let botPrefix = "!dmb "
        var botPrefixRegEx = /!dmb /gi

        const imageAttachment = message.attachments.find(att => att.contentType?.startsWith("image/"));
        if (imageAttachment) {
            discordMessageAttachment = imageAttachment.url;
        }
        

        // Split up the message string by Lines and double colons
        discordMessageLines = discordMessage.split("\n")

        // Check for each Line if it starts with Prefix
        for (let line of discordMessageLines) {
            if(line.startsWith(botPrefix)){    
                // Remove Prefix
                line = line.replace(botPrefixRegEx, "")

                // Split up in Case-Identifyer and Data
                let discordMessageParts: string[] = new Array()
                discordMessageParts = line.split(": ")
                
                switch(discordMessageParts[0]) {
                    // In Case "New Event" create a new one-time Discord Event
                    case "New Event": {
                        createNewDiscordEvent(discordMessageParts[1]!, discordMessageAttachment, discordServerID!, channelSent!)
                        message.react('✅')
                        break
                    }
                    // In Case "New Schedule" create a new Discord Event with Input
                    case "New Schedule": {
                        createNewDiscordSchedule(discordMessageParts[1]!, discordMessageAttachment, discordServerID!, channelSent!)
                        message.react('✅')
                        break
                    }
                    default: {
                        logger.error("Invalid Operation: " + discordMessageParts[0])
                        return
                    }
                }
            }
        }

    })
} catch(e) {
    logger.error(e)
}

await client.login(process.env.DISCORD_BOT_TOKEN)

