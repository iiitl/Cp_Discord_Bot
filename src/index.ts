import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { registerCommands } from './deploy-commands.js';
import { Command, BotEvent } from './types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Updated intents to use GatewayIntentBits from discord.js v14+
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// Type the commands collection
client.commands = new Collection<string, Command>();

// Event when the bot successfully joins a new guild
client.on('guildCreate', async (guild) => {
    console.log(`Joined a new guild: ${guild.name} (${guild.id})`);
    // Register commands as soon as the bot joins the new guild
    await registerCommands(guild.id);
});

// Load commands
const commandFiles = fs
    .readdirSync(path.join(__dirname, 'commands'))
    .filter((file) => file.endsWith('.ts'));

for (const file of commandFiles) {
    import(`./commands/${file}`).then((commandModule: { default: Command }) => {
        const command = commandModule.default;
        client.commands.set(command.data.name, command);
    });
}

// Load events
const eventFiles = fs
    .readdirSync(path.join(__dirname, 'events'))
    .filter((file) => file.endsWith('.ts'));

for (const file of eventFiles) {
    import(`./events/${file}`).then((eventModule: { default: BotEvent }) => {
        const event = eventModule.default;
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    });
}

client.login(process.env.BOT_TOKEN!);
