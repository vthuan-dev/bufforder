const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Read DATABASE_URL from backend/.env
  const envPath = path.join(__dirname, 'backend/.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
  
  if (!dbUrlMatch) {
    console.error('❌ DATABASE_URL not found in backend/.env');
    return;
  }
  
  const connection = await mysql.createConnection(dbUrlMatch[1]);
  
  try {
    console.log('📦 Running USDT Wallet migration...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'backend/migrations/add_usdt_wallets.sql'),
      'utf8'
    );
    
    await connection.query(sql);
    
    console.log('✅ USDT Wallet table created successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await connection.end();
  }
}

runMigration();
