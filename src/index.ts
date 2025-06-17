import { Client, Events, GatewayIntentBits } from 'discord.js'
import { createLogger, format, transports } from 'winston'
import path from 'path';

// Create a new client with Intents for Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
})

const logPath = path.join( __dirname, 'logs', 'PipuBot.logs' )

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

//Confirm Login
try{
    client.once(Events.ClientReady, async (readyClient) => {
        //console.log(`Logged in as ${readyClient.user.tag}`)
        logger.info(`Logged in as ${readyClient.user.tag}`)
    });
} catch(e) {
    logger.warn(e)
}


client.on(Events.MessageCreate, async (message) => {
    logger.info(`${message.author.tag} said ${message.content}`)
})

await client.login(process.env.DISCORD_BOT_TOKEN)
