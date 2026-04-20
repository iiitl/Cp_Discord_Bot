import fetch from 'node-fetch';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getEntryByPlatformMemID } from '../database/fetchData.js';
import { Command } from '../types/index.js';

interface CodeForcesUser {
    handle: string;
    avatar?: string;
    titlePhoto?: string;
}

interface CodeForcesResponse {
    status: string;
    result?: CodeForcesUser[];
}

export default {
    data: new SlashCommandBuilder()
        .setName('cfuserpfp')
        .setDescription('Fetches PFP for the given CodeForces username')
        .addStringOption((option) =>
            option
                .setName('id')
                .setDescription('CodeForces Username')
                .setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        let handle = interaction.options.getString('id');
        const userId = interaction.user.id;

        if (!handle) {
            const row = await getEntryByPlatformMemID('codeforces', userId);
            if (row) {
                handle = row.username;
            } else {
                return await interaction.editReply(
                    'No associated CodeForces username found for this user.'
                );
            }
        }

        if (handle[0] === '<') {
            handle = handle.slice(2).slice(0, -1);
            const row = await getEntryByPlatformMemID('codeforces', handle);
            if (row) {
                handle = row.username;
            } else {
                return await interaction.editReply(
                    'No associated CodeForces username found for this user.'
                );
            }
        }

        const apiUrl = `https://codeforces.com/api/user.info?handles=${handle}`;
        try {
            const response = await fetch(apiUrl);
            const data = (await response.json()) as CodeForcesResponse;

            if (!data || data.status !== 'OK' || !data.result || data.result.length === 0) {
                return await interaction.editReply(
                    `Could not find data for handle: \`${handle}\`.`
                );
            }

            const user = data.result[0];
            const pfpUrl = user.avatar || user.titlePhoto || '';
            
            await interaction.editReply({
                content: `Profile picture for \`${handle}\`:`,
                files: [pfpUrl],
            });
        } catch (error) {
            console.error(error);
            await interaction.editReply(
                'There was an error while fetching the data from CodeForces.'
            );
        }
    },
} as Command;
