import { db } from './database.js';

function insertEntry(
    memId: string,
    userName: string,
    platform: string,
    rating: number | string,
    tag: string
): void {
    const query = `INSERT INTO users (memid, username, platform, rating, tag) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [memId, userName, platform, rating, tag], function (err: Error | null) {
        if (err) {
            console.error('Error inserting user:', err.message);
        } else {
            console.log(`User inserted with ${platform} username: ${userName}`);
        }
    });
}

export { insertEntry };
