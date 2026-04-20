import fetch from 'node-fetch';
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getEntryByPlatformMemID } from '../database/fetchData.js';
import { Command } from '../types/index.js';

interface CodeForcesUser {
    handle: string;
    rating?: number;
    rank?: string;
}

interface CodeForcesProblem {
    name: string;
    rating?: number;
}

interface CodeForcesSubmission {
    problem: CodeForcesProblem;
    verdict?: string;
}

interface UserInfoResponse {
    status: string;
    result?: CodeForcesUser[];
}

interface UserStatusResponse {
    status: string;
    result?: CodeForcesSubmission[];
}

export default {
    data: new SlashCommandBuilder()
        .setName('cfusersolved')
        .setDescription('Prints detailed info for the given CodeForces username')
        .addStringOption((option) =>
            option
                .setName('id')
                .setDescription('CodeForces Username')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        let handle = interaction.options.getString('id', true);

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

        try {
            const userResponse = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
            const userData = (await userResponse.json()) as UserInfoResponse;
            
            if (!userData || userData.status !== 'OK' || !userData.result || userData.result.length === 0) {
                return await interaction.editReply(
                    `Could not find data for handle: \`${handle}\`.`
                );
            }
            
            const user = userData.result[0];

            const statusResponse = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
            const statusData = (await statusResponse.json()) as UserStatusResponse;

            let solved = 0;
            if (statusData.status === 'OK' && statusData.result) {
                const uniqueProblems = new Set<string>();
                statusData.result.forEach((submission) => {
                    if (submission.verdict === 'OK') {
                        uniqueProblems.add(submission.problem.name);
                    }
                });
                solved = uniqueProblems.size;
            }

            const embed = new EmbedBuilder()
                .setTitle(`CodeForces Detailed Stats for ${user.handle}`)
                .setColor(0x0099ff)
                .addFields(
                    { name: 'Rank', value: user.rank || 'Unrated', inline: false },
                    { name: 'Rating', value: user.rating?.toString() || 'Unrated', inline: false },
                    { name: 'Problems Solved', value: solved.toString(), inline: false }
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
