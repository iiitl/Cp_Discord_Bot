import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types/index.js';

export default {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('About the bot!'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply(
            "I'm a bot that can help you find info on Competitive Coding Profiles!"
        );
    },
} as Command;
