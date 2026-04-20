import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types/index.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ccusergraph')
        .setDescription('Fetches rating graph for the given CodeChef username')
        .addStringOption((option) =>
            option
                .setName('id')
                .setDescription('CodeChef Username')
                .setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const handle = interaction.options.getString('id');

        if (!handle) {
            await interaction.editReply('Please provide a CodeChef username.');
            return;
        }

        const graphUrl = `https://codechef-api.vercel.app/graph/${handle}`;
        await interaction.editReply(`Rating graph for \`${handle}\`:\n${graphUrl}`);
    },
} as Command;
