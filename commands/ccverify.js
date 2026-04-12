import puppeteer from 'puppeteer'
import { SlashCommandBuilder } from '@discordjs/builders'
import { insertEntry } from '../database/insertData.js'
import { getEntryByPlatformMemID } from '../database/fetchData.js'
import { updateEntryByPlatformMemID } from '../database/updateData.js'

async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export default {
    data: new SlashCommandBuilder()
        .setName('ccverify')
        .setDescription(
            'Verifies your CodeChef account and assigns the CodeChef role'
        )
        .addStringOption((option) =>
            option
                .setName('id')
                .setDescription('CodeChef Username')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply()
        const handle = interaction.options.getString('id')
        const profileUrl = `https://www.codechef.com/users/${handle}`

        interaction.editReply(
            `Submit a Compilation Error within 1 minute on CodeChef...`
        )
        await delay(60000)

        try {
            const browser = await puppeteer.launch({
                headless: 'new',
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--disable-extensions',
                    '--disable-background-networking',
                    '--disable-default-apps',
                    '--disable-features=site-per-process',
                ],
                protocolTimeout: 60000,
            })

            const page = await browser.newPage()
            await page.goto(profileUrl, { waitUntil: 'networkidle2' })

            let stars = 'No ★'
            let rating = 0

            await page.waitForSelector('.rating-star', { timeout: 10000 })
            await page.waitForSelector('tbody tr', { timeout: 10000 })

            stars = await page.evaluate(() => {
                const starElement = document.querySelector('.rating-star')
                return starElement ? starElement.innerText.trim() : 'No ★'
            })

            rating = await page.evaluate(() => {
                const ratingElement = document.querySelector('.rating-number')
                return ratingElement ? parseInt(ratingElement.innerText) : 0
            })

            const submissions = await page.evaluate(() => {
                let rows = document.querySelectorAll('.dataTable tbody tr')
                let results = []
                let cols = rows[0].querySelectorAll('td')
                if (cols.length > 3) {
                    let verdict = cols[2].innerHTML
                        .trim()
                        .includes('compilation error')
                        ? true
                        : false
                    let timestamp = cols[0].innerHTML.trim()
                    timestamp =
                        timestamp.includes('sec') ||
                        timestamp.includes('1 min') ||
                        timestamp.includes('2 min')
                            ? true
                            : false
                    results.push({ verdict, timestamp })
                }
                return results
            })

            await browser.close()

            if (
                submissions[0].verdict == true &&
                submissions[0].timestamp == true
            ) {
                await interaction.editReply(
                    `Successfully verified CodeChef account \`${handle}\``
                )
            } else {
                return await interaction.editReply(
                    `Failed to verify CodeChef account \`${handle}\``
                )
            }

            let roleName = stars
            let roleTypes = [
                'No ★',
                '★',
                '★★',
                '★★★',
                '★★★★',
                '★★★★★',
                '★★★★★★',
                '★★★★★★★',
            ]

            let role = interaction.guild.roles.cache.find(
                (role) => role.name === roleName
            )

            // 🔥 CHECK PERMISSIONS BEFORE CREATING ROLE
            const botMember = interaction.guild.members.me

            if (!botMember.permissions.has("ManageRoles")) {
                return await interaction.editReply(
                    "❌ Bot lacks **Manage Roles** permission."
                )
            }

            if (!role) {
                try {
                    role = await interaction.guild.roles.create({ name: roleName })
                } catch (err) {
                    console.error(err)
                    return await interaction.editReply(
                        "❌ Failed to create role. Check bot permissions."
                    )
                }
            }

            // 🔥 CHECK ROLE HIERARCHY
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
                    `You already have the \`CodeChef Verified\` role.`
                )
            }

            const user = await getEntryByPlatformMemID('codechef', member.id)

            if (user && user.platform == 'codechef') {
                updateEntryByPlatformMemID(
                    handle,
                    rating,
                    roleName,
                    'codechef',
                    member.id
                )
            } else {
                insertEntry(member.id, handle, 'codechef', rating, roleName)
            }

            // 🔥 REMOVE OLD ROLES SAFELY
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

            // 🔥 SAFE ROLE ASSIGNMENT
            try {
                await member.roles.add(role)
            } catch (err) {
                console.error(err)
                return await interaction.editReply(
                    "❌ Failed to assign role. Please check permissions."
                )
            }

            return await interaction.editReply(
                `Successfully verified CodeChef account \`${handle}\` and assigned the \`${roleName}\` role.`
            )

        } catch (error) {
            console.error(error)
            return await interaction.editReply(
                `An error occurred while verifying the CodeChef account. Please try again.`
            )
        }
    },
}