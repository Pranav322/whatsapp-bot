import { db, groups } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function updatePermissions() {
    console.log('🔄 Updating group permissions...');

    // Add 'sticker' to allowed_commands for all groups where it's missing
    // Postgres array_append adds an element to the end of the array
    // We update only if 'sticker' is NOT already in the array

    try {
        await db.execute(sql`
            UPDATE groups 
            SET allowed_commands = array_append(allowed_commands, 'sticker')
            WHERE NOT ('sticker' = ANY(allowed_commands));
        `);

        console.log('✅ Permissions updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to update permissions:', error);
        process.exit(1);
    }
}

updatePermissions();
