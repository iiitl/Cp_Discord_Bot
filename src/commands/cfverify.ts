import fetch from 'node-fetch';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { insertEntry } from '../database/insertData.js';
import { getEntryByPlatformMemID } from '../database/fetchData.js';
import { updateEntryByPlatformMemID } from '../database/updateData.js';
import { Command } from '../types/index.js';

interface CodeForcesSubmission {
    verdict?: string;
    creationTimeSeconds: number;
}

interface CodeForcesResponse {
    status: string;
    result?: CodeForcesSubmission[];
}

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export default {
    data: new SlashCommandBuilder()
        .setName('cfverify')
        .setDescription('Verifies your CodeForces account and assigns the CodeForces role')
        .addStringOption((option) =>
            option.setName('id').setDescription('CodeForces Username').setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const handle = interaction.options.getString('id', true);
        const apiUrl = `https://codeforces.com/api/user.status?handle=${handle}`;

        const currTime = Date.now() / 1000;
        await interaction.editReply(`Submit a Compilation Error within 1 minute...`);
        await delay(60000);

        try {
            const response = await fetch(apiUrl);
            const data = (await response.json()) as CodeForcesResponse;

            if (!data || data.status !== 'OK' || !data.result || data.result.length === 0) {
                return await interaction.editReply(
                    `Could not find data for handle: \`${handle}\`.`
                );
            }

            const submissions = data.result.filter(
                (submission) => submission.verdict === 'COMPILATION_ERROR'
            );

            if (
                submissions.length > 0 &&
                submissions[0].creationTimeSeconds - currTime <= 60 &&
                submissions[0].creationTimeSeconds - currTime >= 0
            ) {
                await interaction.editReply(`Successfully verified CodeForces account \`${handle}\``);
            } else {
                return await interaction.editReply(`Failed to verify CodeForces account \`${handle}\``);
            }

            const member = await interaction.guild?.members.fetch(interaction.user.id);
            if (!member) {
                return await interaction.editReply(`Could not find member in the server.`);
            }

            let role = interaction.guild?.roles.cache.find((r) => r.name === 'CodeForces Verified');
            if (!role && interaction.guild) {
                role = await interaction.guild.roles.create({ name: 'CodeForces Verified' });
            }

            const user = await getEntryByPlatformMemID('codeforces', member.id);
            if (user && user.platform === 'codeforces') {
                updateEntryByPlatformMemID(handle, '0', 'CodeForces Verified', 'codeforces', member.id);
            } else {
                insertEntry(member.id, handle, 'codeforces', '0', 'CodeForces Verified');
            }

            if (member.roles.cache.has(role!.id)) {
                return await interaction.editReply(`You already have the role.`);
            }

            await member.roles.add(role!);
            await interaction.editReply(`Successfully verified and assigned the role.`);
        } catch (error) {
            console.error(error);
            await interaction.editReply(`An error occurred while verifying.`);
        }
    },
} as Command;
