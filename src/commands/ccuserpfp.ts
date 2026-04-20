import fetch from 'node-fetch';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getEntryByPlatformMemID } from '../database/fetchData.js';
import { Command } from '../types/index.js';

interface CodeChefResponse {
    profile?: string;
    error?: boolean;
}

export default {
    data: new SlashCommandBuilder()
        .setName('ccuserpfp')
        .setDescription('Fetches PFP for the given CodeChef username')
        .addStringOption((option) =>
            option
                .setName('id')
                .setDescription('CodeChef Username')
                .setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        let handle = interaction.options.getString('id');
        const userId = interaction.user.id;

        if (!handle) {
            const row = await getEntryByPlatformMemID('codechef', userId);
            if (row) {
                handle = row.username;
            } else {
                return await interaction.editReply(
                    'No associated CodeChef username found for this user.'
                );
            }
        }

        if (handle[0] === '<') {
            handle = handle.slice(2).slice(0, -1);
            const row = await getEntryByPlatformMemID('codechef', handle);
            if (row) {
                handle = row.username;
            } else {
                return await interaction.editReply(
                    'No associated CodeChef username found for this user.'
                );
            }
        }

        const apiUrl = `https://codechef-api.vercel.app/handle/${handle}`;
        try {
            const response = await fetch(apiUrl);
            const data = (await response.json()) as CodeChefResponse;

            if (!data || data.error) {
                return await interaction.editReply(
                    `Could not find data for handle: \`${handle}\`.`
                );
            }

            const pfpUrl = data.profile || 'https://i.pinimg.com/originals/69/40/7f/69407fe3a7697fa29e1b3b6e96ca22de.jpg';
            
            await interaction.editReply({
                content: `Profile picture for \`${handle}\`:`,
                files: [pfpUrl],
            });
        } catch (error) {
            console.error(error);
            await interaction.editReply(
                'There was an error while fetching the data from CodeChef.'
            );
        }
    },
} as Command;
