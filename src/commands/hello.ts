import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types/index.js';

export default {
    data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Say hello!'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply('Hello! How can I help you today?');
    },
} as Command;
