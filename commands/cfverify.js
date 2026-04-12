import fetch from 'node-fetch'
import { SlashCommandBuilder } from '@discordjs/builders'
import { insertEntry } from '../database/insertData.js'
import { getEntryByPlatformMemID } from '../database/fetchData.js'
import { updateEntryByPlatformMemID } from '../database/updateData.js'

async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export default {
    data: new SlashCommandBuilder()
        .setName('cfverify')
        .setDescription(
            'Verifies your CodeForces account and assigns the CodeForces role'
        )
        .addStringOption((option) =>
            option
                .setName('id')
                .setDescription('CodeForces Username')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply()

        const handle = interaction.options.getString('id')
        const apiUrl = `https://codeforces.com/api/user.status?handle=${handle}`

        const currTime = Date.now() / 1000
        interaction.editReply(`Submit a Compilation Error within 1 minute...`)
        await delay(60000)

        try {
            const response = await fetch(apiUrl)
            let data = await response.json()

            if (!data || data.error || !data.result) {
                return await interaction.editReply(
                    `Could not find data for handle: \`${handle}\`. Please check the handle and try again.`
                )
            }

            data = data.result
            const submissions = data.filter(
                (submission) => submission.verdict === 'COMPILATION_ERROR'
            )

            if (
                submissions.length > 0 &&
                submissions[0].creationTimeSeconds - currTime <= 60000 &&
                submissions[0].creationTimeSeconds - currTime >= 0
            ) {
                await interaction.editReply(
                    `Successfully verified CodeForces account \`${handle}\``
                )
            } else {
                return await interaction.editReply(
                    `Failed to verify CodeForces account \`${handle}\``
                )
            }

            let roleName = ''
            let rating = 0

            try {
                const tempApiUrl = `https://codeforces.com/api/user.info?handles=${handle}`
                const tempResponse = await fetch(tempApiUrl)
                let tempData = await tempResponse.json()

                if (!tempData.result[0].rank) {
                    roleName = 'unrated'
                    rating = 0
                } else {
                    roleName = tempData.result[0].rank.toLowerCase()
                    rating = tempData.result[0].rating
                }
            } catch {
                return await interaction.editReply(
                    `An error occurred while verifying the CodeForces account. Please try again.`
                )
            }

            const roleTypes = [
                'newbie',
                'pupil',
                'specialist',
                'expert',
                'candidate master',
                'master',
                'international master',
                'grandmaster',
                'international grandmaster',
                'legendary grandmaster',
            ]

            const botMember = interaction.guild.members.me

            // ✅ PERMISSION CHECK
            if (!botMember.permissions.has("ManageRoles")) {
                return await interaction.editReply(
                    "❌ Bot lacks **Manage Roles** permission."
                )
            }

            let role = interaction.guild.roles.cache.find(
                (role) => role.name === roleName
            )

            // ✅ SAFE ROLE CREATION
            if (!role) {
                try {
                    role = await interaction.guild.roles.create({
                        name: roleName,
                    })
                } catch (err) {
                    console.error(err)
                    return await interaction.editReply(
                        "❌ Failed to create role. Check bot permissions."
                    )
                }
            }

            // ✅ ROLE HIERARCHY CHECK
            if (role.position >= botMember.roles.highest.position) {
                return await interaction.editReply(
                    "❌ Cannot assign this role due to role hierarchy."
                )
            }

            const member = interaction.guild.members.cache.get(
                interaction.user.id
            )

            if (!member) {
                return await interaction.editReply(
                    `Could not find the member in the server. Please try again.`
                )
            }

            if (member.roles.cache.has(role.id)) {
                return await interaction.editReply(
                    `You already have the \`CodeForces\` role.`
                )
            }

            const user = await getEntryByPlatformMemID('codeforces', member.id)

            if (user && user.platform == 'codeforces') {
                updateEntryByPlatformMemID(
                    handle,
                    rating,
                    roleName,
                    'codeforces',
                    member.id
                )
            } else {
                insertEntry(member.id, handle, 'codeforces', rating, roleName)
            }

            // ✅ SAFE ROLE REMOVAL
            for (const element of roleTypes) {
                const existingRole = member.roles.cache.find(
                    (r) => r.name === element
                )
                if (existingRole) {
                    try {
                        await member.roles.remove(existingRole)
                    } catch (err) {
                        console.error(err)
                    }
                }
            }

            // ✅ SAFE ROLE ASSIGN
            try {
                await member.roles.add(role)
            } catch (err) {
                console.error(err)
                return await interaction.editReply(
                    "❌ Failed to assign role. Please check permissions."
                )
            }

            return await interaction.editReply(
                `Successfully verified CodeForces account \`${handle}\` and assigned the \`${roleName}\` role.`
            )
        } catch (error) {
            console.error(error)
            return await interaction.editReply(
                `An error occurred while verifying the CodeForces account. Please try again.`
            )
        }
    },
}