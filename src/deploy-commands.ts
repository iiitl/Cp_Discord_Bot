import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import dotenv from 'dotenv';

dotenv.config();

// Define command structure with types
interface CommandOption {
    name: string;
    description: string;
    required: boolean;
    type: number;
}

interface CommandData {
    name: string;
    description: string;
    options?: CommandOption[];
}

// Define your slash commands
const commands: CommandData[] = [
    {
        name: 'hello',
        description: 'Say hello!',
    },
    {
        name: 'about',
        description: 'About the bot!',
    },
    {
        name: 'ccuserinfo',
        description: 'Prints info for the given CodeChef username',
        options: [
            {
                name: 'id',
                description: 'CodeChef Username',
                required: false,
                type: 3, // Type 3 corresponds to STRING
            },
        ],
    },
    {
        name: 'ccuserpfp',
        description: 'Fetches PFP for the given CodeChef username',
        options: [
            {
                name: 'id',
                description: 'CodeChef Username',
                required: false,
                type: 3, // Type 3 corresponds to STRING
            },
        ],
    },
    {
        name: 'ccverify',
        description: 'Verifies your CodeChef account and assigns the CodeChef role',
        options: [
            {
                name: 'id',
                description: 'CodeChef Username',
                required: true,
                type: 3, // Type 3 corresponds to STRING
            },
        ],
    },
    {
        name: 'ccunverify',
        description: 'Un-Verifies your CodeChef account and removes the CodeChef role',
    },
    {
        name: 'cfuserinfo',
        description: 'Prints info for the given CodeForces username',
        options: [
            {
                name: 'id',
                description: 'CodeForces Username',
                required: false,
                type: 3, // Type 3 corresponds to STRING
            },
        ],
    },
    {
        name: 'cfuserpfp',
        description: 'Fetches PFP for the given CodeForces username',
        options: [
            {
                name: 'id',
                description: 'CodeForces Username',
                required: false,
                type: 3, // Type 3 corresponds to STRING
            },
        ],
    },
    {
        name: 'cfusersolved',
        description: 'Prints detailed info for the given CodeForces username',
        options: [
            {
                name: 'id',
                description: 'CodeForces Username',
                required: false,
                type: 3, // Type 3 corresponds to STRING
            },
        ],
    },
    {
        name: 'cfverify',
        description: 'Verifies your CodeForces account and assigns the CodeForces role',
        options: [
            {
                name: 'id',
                description: 'CodeForces Username',
                required: true,
                type: 3, // Type 3 corresponds to STRING
            },
        ],
    },
    {
        name: 'cfunverify',
        description: 'Un-Verifies your CodeForces account and removes the CodeForces role',
    },
];

// Function to register commands for a single guild
export async function registerCommands(GUILD_ID: string): Promise<void> {
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);

    try {
        console.log(`Started refreshing application (/) commands for guild ${GUILD_ID}.`);

        // Register commands to this guild
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID!, GUILD_ID),
            {
                body: commands,
            }
        );

        console.log(`Successfully reloaded commands for guild: ${GUILD_ID}`);
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}
