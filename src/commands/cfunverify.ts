import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getEntryByPlatformMemID } from '../database/fetchData.js';
import { deleteEntry } from '../database/deleteData.js';
import { Command } from '../types/index.js';

export default {
    data: new SlashCommandBuilder()
        .setName('cfunverify')
        .setDescription('Un-Verifies your CodeForces account and removes the CodeForces role'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const user = await getEntryByPlatformMemID('codeforces', interaction.user.id);
        const member = await interaction.guild?.members.fetch(interaction.user.id);
        
        if (!member) {
            return await interaction.editReply({
                content: 'Could not find member in the server.',
            });
        }

        if (user) {
            deleteEntry(interaction.user.id, 'codeforces');
            
            if (member.roles.cache.some((role) => role.name === user.tag)) {
                const roleToRemove = member.roles.cache.find(
                    (role) => role.name === user.tag
                );
                if (roleToRemove) {
                    await member.roles.remove(roleToRemove);
                }
            }
            
            await interaction.editReply({
                content: 'Un-verified your CodeForces account',
            });
        } else {
            await interaction.editReply({
                content: 'You are not verified as a CodeForces user',
            });
        }
    },
} as Command;
