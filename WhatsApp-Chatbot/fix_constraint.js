import db from './src/db.js';

async function fixConstraint() {
  try {
    console.log('🔄 Dropping old constraint...');
    await db.query(`
      ALTER TABLE sessions 
      DROP CONSTRAINT IF EXISTS valid_service_data
    `);
    console.log('✅ Old constraint dropped');

    console.log('🔄 Adding updated constraint...');
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
              AND number_of_people IS NULL
              AND dine_time IS NULL
          )
           OR (
              service_type NOT IN ('dine_in', 'delivery')
          )
      )
    `);
    console.log('✅ New constraint added');

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixConstraint();
