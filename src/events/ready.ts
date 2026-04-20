import { Client, Events } from 'discord.js';
import { db } from '../database/database.js';
import { registerCommands } from '../deploy-commands.js';
import { BotEvent } from '../types/index.js';

export default {
    name: Events.ClientReady,
    once: true,
    execute(client: Client<true>) {
        console.log(`Bot is online as ${client.user.tag}`);
        // Log the IDs of all guilds the bot is in
        const guildIds: string[] = [];
        client.guilds.cache.forEach((guild) => {
            console.log(`Bot is in guild: ${guild.name} (${guild.id})`);
            guildIds.push(guild.id);
        });

        // Optionally, register commands for all guilds the bot is in
        client.guilds.cache.forEach((guild) => {
            registerCommands(guild.id);
        });
        
        // Optional: You can check the database or perform actions
        // Example: Create a table if it doesn't exist
        db.run(
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                memid TEXT,
                username TEXT,
                platform TEXT,
                rating TEXT,
                tag TEXT,
                UNIQUE (username, platform)
            )`,
            (err: Error | null) => {
                if (err) {
                    console.error('Error creating table:', err.message);
                } else {
                    console.log('Table "users" checked/created.');
                }
            }
        );
    },
} as BotEvent;
