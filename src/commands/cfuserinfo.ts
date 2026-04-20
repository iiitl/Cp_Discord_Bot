import fetch from 'node-fetch';
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getEntryByPlatformMemID } from '../database/fetchData.js';
import { Command } from '../types/index.js';

interface CodeForcesUser {
    handle: string;
    rating?: number;
    maxRating?: number;
    rank?: string;
    maxRank?: string;
    avatar?: string;
    titlePhoto?: string;
}

interface CodeForcesResponse {
    status: string;
    result?: CodeForcesUser[];
}

export default {
    data: new SlashCommandBuilder()
        .setName('cfuserinfo')
        .setDescription('Prints info for the given CodeForces username')
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
            
            const embed = new EmbedBuilder()
                .setTitle(`CodeForces Stats for ${user.handle}`)
                .setColor(0x0099ff)
                .setThumbnail(user.avatar || user.titlePhoto || '')
                .addFields(
                    { name: 'Rank', value: user.rank || 'Unrated', inline: false },
                    { name: 'Rating', value: user.rating?.toString() || 'Unrated', inline: false },
                    { name: 'Max Rating', value: user.maxRating?.toString() || 'Unrated', inline: false },
                    { name: 'Max Rank', value: user.maxRank || 'Unrated', inline: false }
                );

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply(
                'There was an error while fetching the data from CodeForces.'
            );
        }
    },
} as Command;
