
import db from './src/db.js';

async function migrate() {
    console.log('🔄 Starting migration: Add reservation columns and constraint to sessions table...\n');

    try {
        // 1. Add columns
        console.log('   ⏳ Adding number_of_people column...');
        await db.query(`
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS number_of_people INT
    `);
        console.log('      ✅ number_of_people column added');

        console.log('   ⏳ Adding dine_time column...');
        await db.query(`
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS dine_time TIMESTAMP
    `);
        console.log('      ✅ dine_time column added');

        // 2. Add Constraint
        console.log('   ⏳ Applying valid_service_data constraint...');
        // Drop first if exists to ensure latest version
        await db.query(`
      ALTER TABLE sessions DROP CONSTRAINT IF EXISTS valid_service_data
    `);

        await db.query(`
        ALTER TABLE sessions ADD CONSTRAINT valid_service_data
        CHECK (
            service_type IS NULL
            OR (
                service_type = 'dine_in'
                AND number_of_people IS NOT NULL
                AND dine_time IS NOT NULL
                AND delivery_address IS NULL
            )
            OR (
                service_type = 'delivery'
                AND delivery_address IS NOT NULL
                AND number_of_people IS NULL
                AND dine_time IS NULL
            )
             OR (
                service_type NOT IN ('dine_in', 'delivery')
            )
        )
    `);
        console.log('      ✅ valid_service_data constraint applied');

        console.log('\n✅ Reservation migration completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
