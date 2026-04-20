import { db } from './database.js';

function deleteEntry(memId: string, platform: string): void {
    const query = `DELETE FROM users WHERE memid=? AND platform=?`;
    db.run(query, [memId, platform], function (err: Error | null) {
        if (err) {
            console.error('Error deleting Entry:', err.message);
        } else {
            console.log(`Entry deleted`);
        }
    });
}

const deleteAllEntries = (): void => {
    const query = `DELETE FROM users`;
    db.run(query, [], function (err: Error | null) {
        if (err) {
            console.error('Error deleting users:', err.message);
        } else {
            console.log(`Successfully deleted all users`);
        }
    });
};

const deleteTable = (): void => {
    const query = `DROP TABLE users`;
    db.run(query, [], function (err: Error | null) {
        if (err) {
            console.error('Error deleting table users:', err.message);
        } else {
            console.log(`Successfully deleted table users`);
        }
    });
};

export { deleteAllEntries, deleteTable, deleteEntry };
