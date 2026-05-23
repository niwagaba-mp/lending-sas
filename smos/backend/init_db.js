const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function initDB() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: Database initialization is disabled in production to prevent data loss.');
    process.exit(1);
  }
  console.log('Connecting to database:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    const schemaPath = path.join(__dirname, '../database/001_schema.sql');
    const seedPath = path.join(__dirname, '../database/002_seed.sql');

    console.log('Reading schema file...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Reading seed file...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing schema (this drops existing tables)...');
    await pool.query(schemaSql);
    console.log('Schema created successfully!');

    console.log('Executing seed data...');
    await pool.query(seedSql);
    console.log('Demo data inserted successfully!');

    console.log('✅ Database Initialization Complete!');
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err.message);
  } finally {
    await pool.end();
  }
}

initDB();
