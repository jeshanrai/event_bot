#!/usr/bin/env node

/**
 * Migration Script: Add Order Details Columns to Sessions Table
 * 
 * This script adds the new order details columns to the existing sessions table:
 * - payment_method
 * - service_type
 * - delivery_address
 * 
 * Usage: node migrate_sessions_table.js
 */

import db from './src/db.js';

async function migrate() {
  console.log('🔄 Starting migration: Add order details columns to sessions table...\n');

  try {
    // Check if columns already exist
    console.log('📋 Checking current table structure...');
    const checkRes = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sessions'
    `);

    const existingColumns = checkRes.rows.map(row => row.column_name);
    console.log('   Current columns:', existingColumns.join(', '));

    const columnsToAdd = [];
    if (!existingColumns.includes('payment_method')) columnsToAdd.push('payment_method');
    if (!existingColumns.includes('service_type')) columnsToAdd.push('service_type');
    if (!existingColumns.includes('delivery_address')) columnsToAdd.push('delivery_address');

    if (columnsToAdd.length === 0) {
      console.log('\n✅ All columns already exist! No migration needed.\n');
      process.exit(0);
    }

    console.log(`\n🚀 Adding ${columnsToAdd.length} new column(s)...\n`);

    // Add payment_method column
    if (columnsToAdd.includes('payment_method')) {
      console.log('   ⏳ Adding payment_method column...');
      await db.query(`
        ALTER TABLE sessions 
        ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20)
      `);
      console.log('      ✅ payment_method column added');
    }

    // Add service_type column
    if (columnsToAdd.includes('service_type')) {
      console.log('   ⏳ Adding service_type column...');
      await db.query(`
        ALTER TABLE sessions 
        ADD COLUMN IF NOT EXISTS service_type VARCHAR(20)
      `);
      console.log('      ✅ service_type column added');
    }

    // Add delivery_address column
    if (columnsToAdd.includes('delivery_address')) {
      console.log('   ⏳ Adding delivery_address column...');
      await db.query(`
        ALTER TABLE sessions 
        ADD COLUMN IF NOT EXISTS delivery_address TEXT
      `);
      console.log('      ✅ delivery_address column added');
    }

    // Verify migration
    console.log('\n✅ Verifying migration...');
    const verifyRes = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sessions'
      ORDER BY ordinal_position
    `);

    console.log('   Final table structure:');
    verifyRes.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.column_name}`);
    });

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📝 Summary:');
    console.log('   - payment_method: Stores payment method (ONLINE, CASH, etc.)');
    console.log('   - service_type: Stores service type (dine_in, delivery)');
    console.log('   - delivery_address: Stores delivery address\n');
    console.log('💡 The context.js file has been updated to handle these new fields automatically.');
    console.log('💡 Order details will now persist in session storage.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure database connection is working');
    console.error('2. Check database credentials in .env file');
    console.error('3. Verify you have permission to ALTER TABLE');
    console.error('\nFor manual migration, run these SQL commands:');
    console.error(`
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS service_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS delivery_address TEXT;
    `);
    process.exit(1);
  }
}

// Run migration
migrate();
