import db from './db.js';

async function fixSchema() {
    console.log('🔧 Fixing schema...');
    try {
        await db.query('DROP TABLE IF EXISTS sessions CASCADE');
        console.log('✅ Dropped sessions table.');

        // We let initDb.js recreate it correctly later, or we can just exit and let the user run initDb.
        // But to be sure, let's just drop it.
    } catch (error) {
        console.error('❌ Error fixing schema:', error);
    } finally {
        await db.end();
    }
}

fixSchema();
