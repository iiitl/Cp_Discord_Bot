import fetch from 'node-fetch';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getEntryByPlatformMemID } from '../database/fetchData.js';
import { Command } from '../types/index.js';

interface CodeChefResponse {
    name?: string;
    currentRating?: number;
    highestRating?: number;
    stars?: string;
    globalRank?: number;
    profile?: string;
    ratingData?: any[];
    error?: boolean;
}

export default {
    data: new SlashCommandBuilder()
        .setName('ccuserinfo')
        .setDescription('Prints info for the given CodeChef username')
        .addStringOption((option) =>
            option
                .setName('id')
                .setDescription('CodeChef Username')
                .setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        // Get the handle input from the user
        let handle = interaction.options.getString('id');
        const userId = interaction.user.id;

        // If no ID is provided, fetch associated username from the database
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

        // Make the API request to get CodeChef user data
        const apiUrl = `https://codechef-api.vercel.app/handle/${handle}`;
        try {
            const response = await fetch(apiUrl);
            const data = (await response.json()) as CodeChefResponse;

            // Check if the API returned a valid response
            if (!data || data.error) {
                return await interaction.editReply(
                    `Could not find data for handle: \`${handle}\`. Please check the handle and try again.`
                );
            }

            // Extract useful data from the response
            const {
                name,
                currentRating,
                highestRating,
                stars,
                globalRank,
                profile,
            } = data;
            const contests = data.ratingData?.length || 0;
            const pfpUrl =
                profile ||
                'https://i.pinimg.com/originals/69/40/7f/69407fe3a7697fa29e1b3b6e96ca22de.jpg';

            // Create the embed to send as a reply
            const embed = {
                color: 0x0099ff,
                title: `CodeChef Stats for ${handle}`,
                thumbnail: {
                    url: pfpUrl,
                },
                fields: [
                    {
                        name: 'Name',
                        value: name || 'N/A',
                        inline: false,
                    },
                    {
                        name: 'Current Rating',
                        value: currentRating
                            ? currentRating.toString()
                            : 'UnRated',
                        inline: false,
                    },
                    {
                        name: 'Highest Rating',
                        value: highestRating
                            ? highestRating.toString()
                            : 'UnRated',
                        inline: false,
                    },
                    {
                        name: 'Stars',
                        value: stars || 'No ★',
                        inline: false,
                    },
                    {
                        name: 'Contests Given',
                        value: contests.toString(),
                        inline: false,
                    },
                    {
                        name: 'Global Rank',
                        value: globalRank
                            ? globalRank.toString()
                            : 'Not Ranked',
                        inline: false,
                    },
                ],
                footer: {
                    text: 'Data fetched from CodeChef API',
                },
            };

            // Send the embed as a reply
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply(
                'There was an error while fetching the data from CodeChef. Please try again later.'
            );
        }
    },
} as Command;
