import { db } from './database.js';

function updateEntryByPlatformMemID(
    username: string,
    rating: number | string,
    tag: string,
    platform: string,
    memId: string
): void {
    const query = `UPDATE users SET username = ?, rating = ?, tag = ? WHERE platform = ? AND memid = ?`;
    db.run(query, [username, rating, tag, platform, memId], function (err: Error | null) {
        if (err) {
            console.error('Error updating user:', err.message);
        } else {
            console.log(`User updated with ${platform} username: ${username}`);
        }
    });
}

export { updateEntryByPlatformMemID };
