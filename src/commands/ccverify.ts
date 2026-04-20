import puppeteer from 'puppeteer';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { insertEntry } from '../database/insertData.js';
import { getEntryByPlatformMemID } from '../database/fetchData.js';
import { updateEntryByPlatformMemID } from '../database/updateData.js';
import { Command, SubmissionResult } from '../types/index.js';

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export default {
    data: new SlashCommandBuilder()
        .setName('ccverify')
        .setDescription('Verifies your CodeChef account and assigns the CodeChef role')
        .addStringOption(option =>
            option.setName('id').setDescription('CodeChef Username').setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const handle = interaction.options.getString('id', true);
        const profileUrl = `https://www.codechef.com/users/${handle}`;

        await interaction.editReply(`Submit a Compilation Error within 1 minute on CodeChef...`);
        await delay(60000);

        try {
            const browser = await puppeteer.launch({
                headless: true,
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
            });
            
            const page = await browser.newPage();
            await page.goto(profileUrl, { waitUntil: 'networkidle2' });
            
            let stars = 'No ★';
            let rating = 0;

            await page.waitForSelector('.rating-star', { timeout: 10000 });
            await page.waitForSelector('tbody tr', { timeout: 10000 });

            stars = await page.evaluate((): string => {
                const starElement = document.querySelector('.rating-star');
                return starElement ? (starElement as HTMLElement).innerText.trim() : 'No ★';
            });

            rating = await page.evaluate((): number => {
                const ratingElement = document.querySelector('.rating-number');
                return ratingElement ? parseInt((ratingElement as HTMLElement).innerText) : 0;
            });

            const submissions = await page.evaluate((): SubmissionResult[] => {
                const rows = document.querySelectorAll('.dataTable tbody tr');
                const results: SubmissionResult[] = [];
                
                if (rows.length > 0) {
                    const cols = rows[0].querySelectorAll('td');
                    if (cols.length > 3) {
                        const verdict = cols[2].innerHTML.trim().includes('compilation error');
                        let timestamp = cols[0].innerHTML.trim();
                        const isRecent = timestamp.includes('sec') || timestamp.includes('1 min') || timestamp.includes('2 min');
                        results.push({ verdict, timestamp: isRecent });
                    }
                }
                
                return results;
            });

            await browser.close();

            if (submissions[0]?.verdict && submissions[0]?.timestamp) {
                await interaction.editReply(`Successfully verified CodeChef account \`${handle}\``);
            } else {
                return await interaction.editReply(`Failed to verify CodeChef account \`${handle}\``);
            }

            const roleName = stars;
            const roleTypes = ['No ★', '★', '★★', '★★★', '★★★★', '★★★★★', '★★★★★★', '★★★★★★★'];
            
            let role = interaction.guild?.roles.cache.find((r) => r.name === roleName);
            if (!role && interaction.guild) {
                role = await interaction.guild.roles.create({ name: roleName });
            }

            const member = await interaction.guild?.members.fetch(interaction.user.id);
            if (!member) {
                return await interaction.editReply(`Could not find the member in the server.`);
            }

            if (member.roles.cache.has(role!.id)) {
                return await interaction.editReply(`You already have the role.`);
            }

            const user = await getEntryByPlatformMemID('codechef', member.id);
            if (user && user.platform === 'codechef') {
                updateEntryByPlatformMemID(handle, rating, roleName, 'codechef', member.id);
            } else {
                insertEntry(member.id, handle, 'codechef', rating, roleName);
            }

            for (const element of roleTypes) {
                const existingRole = member.roles.cache.find((r) => r.name === element);
                if (existingRole) {
                    await member.roles.remove(existingRole);
                }
            }

            await member.roles.add(role!);
            await interaction.editReply(`Successfully verified CodeChef account \`${handle}\` and assigned the \`${roleName}\` role.`);
        } catch (error) {
            console.error(error);
            await interaction.editReply(`An error occurred while verifying the CodeChef account.`);
        }
    },
} as Command;
