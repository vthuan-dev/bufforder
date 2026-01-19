const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, 'backend', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

async function runMigration() {
  console.log('🔄 Running product URL migration...');
  
  const connection = await mysql.createConnection({
    host: envVars.DB_HOST || 'localhost',
    user: envVars.DB_USER || 'root',
    password: envVars.DB_PASSWORD || '',
    database: envVars.DB_NAME || 'greeting_message',
    multipleStatements: true
  });

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'backend', 'migrations', 'add_product_url.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration...');
    await connection.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the column was added
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM product LIKE 'productUrl'
    `);
    
    if (columns.length > 0) {
      console.log('✅ productUrl column verified in database');
    } else {
      console.log('⚠️  Warning: productUrl column not found');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ All done! You can now run: node seed-products-from-api.js');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
