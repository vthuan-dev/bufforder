#!/usr/bin/env node

/**
 * Database Structure Checker
 * Kiểm tra cấu trúc database tại server
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseStructure() {
  console.log('🔍 CHECKING DATABASE STRUCTURE...\n');
  console.log('=' .repeat(80));

  try {
    // 1. Check Database Connection
    console.log('\n📡 1. DATABASE CONNECTION');
    console.log('-'.repeat(80));
    await prisma.$connect();
    console.log('✅ Connected to database successfully');
    
    // Get database info
    const dbInfo = await prisma.$queryRaw`SELECT DATABASE() as db_name, VERSION() as version`;
    console.log(`📊 Database: ${dbInfo[0].db_name}`);
    console.log(`🔢 MySQL Version: ${dbInfo[0].version}`);

    // 2. Check All Tables
    console.log('\n📋 2. DATABASE TABLES');
    console.log('-'.repeat(80));
    const tables = await prisma.$queryRaw`
      SELECT 
        TABLE_NAME,
        TABLE_ROWS,
        ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS size_mb,
        ENGINE,
        TABLE_COLLATION
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `;
    
    console.log(`\nTotal Tables: ${tables.length}\n`);
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.TABLE_NAME}`);
      console.log(`   Rows: ${table.TABLE_ROWS || 0}`);
      console.log(`   Size: ${table.size_mb || 0} MB`);
      console.log(`   Engine: ${table.ENGINE}`);
      console.log(`   Collation: ${table.TABLE_COLLATION}`);
      console.log('');
    });

    // 3. Check Each Table Structure
    console.log('\n📐 3. TABLE STRUCTURES');
    console.log('-'.repeat(80));

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`\n▶ Table: ${tableName}`);
      console.log('  ' + '-'.repeat(76));

      // Get columns
      const columns = await prisma.$queryRaw`
        SELECT 
          COLUMN_NAME,
          COLUMN_TYPE,
          IS_NULLABLE,
          COLUMN_KEY,
          COLUMN_DEFAULT,
          EXTRA
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ${tableName}
        ORDER BY ORDINAL_POSITION
      `;

      console.log(`  Columns (${columns.length}):`);
      columns.forEach(col => {
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const key = col.COLUMN_KEY ? `[${col.COLUMN_KEY}]` : '';
        const extra = col.EXTRA ? `(${col.EXTRA})` : '';
        const defaultVal = col.COLUMN_DEFAULT !== null ? `DEFAULT: ${col.COLUMN_DEFAULT}` : '';
        
        console.log(`    • ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${nullable} ${key} ${extra} ${defaultVal}`.trim());
      });
    }

    // 4. Check Indexes
    console.log('\n\n🔑 4. INDEXES');
    console.log('-'.repeat(80));

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      const indexes = await prisma.$queryRaw`
        SELECT 
          INDEX_NAME,
          COLUMN_NAME,
          NON_UNIQUE,
          SEQ_IN_INDEX,
          INDEX_TYPE
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ${tableName}
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `;

      if (indexes.length > 0) {
        console.log(`\n▶ ${tableName}:`);
        
        // Group by index name
        const indexGroups = {};
        indexes.forEach(idx => {
          if (!indexGroups[idx.INDEX_NAME]) {
            indexGroups[idx.INDEX_NAME] = {
              columns: [],
              unique: idx.NON_UNIQUE === 0,
              type: idx.INDEX_TYPE
            };
          }
          indexGroups[idx.INDEX_NAME].columns.push(idx.COLUMN_NAME);
        });

        Object.entries(indexGroups).forEach(([name, info]) => {
          const uniqueStr = info.unique ? '[UNIQUE]' : '';
          console.log(`  • ${name} ${uniqueStr} (${info.type}): ${info.columns.join(', ')}`);
        });
      }
    }

    // 5. Check Foreign Keys
    console.log('\n\n🔗 5. FOREIGN KEY RELATIONSHIPS');
    console.log('-'.repeat(80));

    const foreignKeys = await prisma.$queryRaw`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, CONSTRAINT_NAME
    `;

    if (foreignKeys.length > 0) {
      foreignKeys.forEach(fk => {
        console.log(`  ${fk.TABLE_NAME}.${fk.COLUMN_NAME}`);
        console.log(`    → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
        console.log(`    (${fk.CONSTRAINT_NAME})\n`);
      });
    } else {
      console.log('  No foreign keys found');
    }

    // 6. Check Table Counts
    console.log('\n📊 6. TABLE ROW COUNTS (ACTUAL)');
    console.log('-'.repeat(80));

    const counts = {};
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        counts[tableName] = result[0].count;
      } catch (error) {
        counts[tableName] = 'Error';
      }
    }

    Object.entries(counts)
      .sort((a, b) => (typeof b[1] === 'number' ? b[1] : 0) - (typeof a[1] === 'number' ? a[1] : 0))
      .forEach(([table, count]) => {
        console.log(`  ${table.padEnd(30)} : ${count.toLocaleString()}`);
      });

    // 7. Check Prisma Schema vs Database
    console.log('\n\n🔄 7. PRISMA SCHEMA VALIDATION');
    console.log('-'.repeat(80));
    
    try {
      // This will throw if schema doesn't match database
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Prisma schema matches database structure');
    } catch (error) {
      console.log('❌ Prisma schema mismatch detected');
      console.log(`   Error: ${error.message}`);
    }

    // 8. Database Size Summary
    console.log('\n\n💾 8. DATABASE SIZE SUMMARY');
    console.log('-'.repeat(80));

    const sizeInfo = await prisma.$queryRaw`
      SELECT 
        ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS total_size_mb,
        ROUND(SUM(DATA_LENGTH) / 1024 / 1024, 2) AS data_size_mb,
        ROUND(SUM(INDEX_LENGTH) / 1024 / 1024, 2) AS index_size_mb
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
    `;

    console.log(`  Total Size    : ${sizeInfo[0].total_size_mb} MB`);
    console.log(`  Data Size     : ${sizeInfo[0].data_size_mb} MB`);
    console.log(`  Index Size    : ${sizeInfo[0].index_size_mb} MB`);

    // 9. Check for Missing Indexes (Common patterns)
    console.log('\n\n⚠️  9. INDEX RECOMMENDATIONS');
    console.log('-'.repeat(80));

    // Check if foreign key columns have indexes
    const missingIndexes = [];
    for (const fk of foreignKeys) {
      const hasIndex = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ${fk.TABLE_NAME}
          AND COLUMN_NAME = ${fk.COLUMN_NAME}
      `;
      
      if (hasIndex[0].count === 0) {
        missingIndexes.push(`${fk.TABLE_NAME}.${fk.COLUMN_NAME}`);
      }
    }

    if (missingIndexes.length > 0) {
      console.log('  ⚠️  Foreign key columns without indexes:');
      missingIndexes.forEach(col => console.log(`    • ${col}`));
    } else {
      console.log('  ✅ All foreign key columns are indexed');
    }

    // 10. Summary
    console.log('\n\n📈 10. SUMMARY');
    console.log('-'.repeat(80));
    console.log(`  Total Tables       : ${tables.length}`);
    console.log(`  Total Foreign Keys : ${foreignKeys.length}`);
    console.log(`  Total Rows         : ${Object.values(counts).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0).toLocaleString()}`);
    console.log(`  Database Size      : ${sizeInfo[0].total_size_mb} MB`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ DATABASE STRUCTURE CHECK COMPLETED\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabaseStructure()
  .catch(console.error);
