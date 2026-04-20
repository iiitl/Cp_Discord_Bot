import { executeQuery } from './database.js';
import { User } from '../types/index.js';

async function getEntryByPlatformMemID(
    platform: string,
    memId: string
): Promise<User | null> {
    try {
        const users = await executeQuery<User>(
            `SELECT * FROM users WHERE memid = ? AND platform = ?`,
            [memId, platform]
        );
        return users[0] || null; // Return the first user if found, otherwise null
    } catch (err) {
        console.error('Error fetching user:', err);
        return null;
    }
}

export { getEntryByPlatformMemID };
