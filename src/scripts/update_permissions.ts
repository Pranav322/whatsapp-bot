import { db } from '../db/index.js';
import { groups } from '../db/schema.js';
import { sql } from 'drizzle-orm';

async function updateGroupPermissions() {
    console.log('🔄 Updating group permissions...');

    try {
        // Append new commands to the allowed_commands array for all groups
        // This uses PostgreSQL array_cat or similar logic
        // But Drizzle update is easier if we just reset or append uniquely

        // Since we can't easily append uniquely in a single query across all rows without raw SQL complexity,
        // let's just use raw SQL to append if not exists, or simpler:
        // Update all groups to include these commands if they don't have them.

        // Simpler approach: Fetch all groups, update them.
        const allGroups = await db.select().from(groups);

        const newCommands = ['spotify', 'play', 'pause', 'next', 'previous'];

        for (const group of allGroups) {
            const currentCommands = group.allowedCommands || [];
            const updatedCommands = [...new Set([...currentCommands, ...newCommands])];

            if (updatedCommands.length !== currentCommands.length) {
                await db.update(groups)
                    .set({ allowedCommands: updatedCommands })
                    .where(sql`${groups.id} = ${group.id}`);
                console.log(`✅ Updated group ${group.groupId}`);
            }
        }

        console.log('✨ All groups updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating groups:', error);
        process.exit(1);
    }
}

updateGroupPermissions();
