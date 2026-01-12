#!/usr/bin/env node

/**
 * Script to verify that the project only uses MySQL (Prisma)
 * and has no MongoDB/Mongoose references
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying MySQL-only setup...\n');

let hasErrors = false;

// 1. Check package.json
console.log('1️⃣ Checking package.json...');
const packageJson = JSON.parse(fs.readFileSync('./backend/package.json', 'utf8'));
if (packageJson.dependencies.mongoose) {
  console.log('   ❌ Found mongoose in dependencies');
  hasErrors = true;
} else {
  console.log('   ✅ No mongoose in dependencies');
}

if (packageJson.dependencies['@prisma/client'] && packageJson.dependencies.prisma) {
  console.log('   ✅ Prisma packages found');
} else {
  console.log('   ❌ Missing Prisma packages');
  hasErrors = true;
}

// 2. Check config.js
console.log('\n2️⃣ Checking config.js...');
const configContent = fs.readFileSync('./backend/config.js', 'utf8');
if (configContent.includes('MONGODB_URI') || configContent.includes('mongodb://')) {
  console.log('   ❌ Found MongoDB references in config');
  hasErrors = true;
} else {
  console.log('   ✅ No MongoDB references in config');
}

if (configContent.includes('DATABASE_URL')) {
  console.log('   ✅ DATABASE_URL found');
} else {
  console.log('   ❌ DATABASE_URL not found');
  hasErrors = true;
}

// 3. Check if models directory is empty or doesn't exist
console.log('\n3️⃣ Checking models directory...');
const modelsDir = './backend/models';
if (fs.existsSync(modelsDir)) {
  const files = fs.readdirSync(modelsDir);
  if (files.length > 0) {
    console.log(`   ⚠️  Found ${files.length} files in models directory:`);
    files.forEach(file => console.log(`      - ${file}`));
    console.log('   💡 These should be removed as we use Prisma schema');
    hasErrors = true;
  } else {
    console.log('   ✅ Models directory is empty');
  }
} else {
  console.log('   ✅ Models directory does not exist');
}

// 4. Check if Prisma schema exists
console.log('\n4️⃣ Checking Prisma schema...');
const schemaPath = './backend/prisma/schema.prisma';
if (fs.existsSync(schemaPath)) {
  console.log('   ✅ Prisma schema found');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  if (schemaContent.includes('datasource db') && schemaContent.includes('provider = "mysql"')) {
    console.log('   ✅ MySQL datasource configured');
  } else {
    console.log('   ❌ MySQL datasource not properly configured');
    hasErrors = true;
  }
} else {
  console.log('   ❌ Prisma schema not found');
  hasErrors = true;
}

// 5. Check routes for Prisma usage
console.log('\n5️⃣ Checking routes...');
const routesDir = './backend/routes';
if (fs.existsSync(routesDir)) {
  const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  let allUsingPrisma = true;
  
  routeFiles.forEach(file => {
    const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
    if (content.includes('require(\'mongoose\')') || content.includes('require("mongoose")')) {
      console.log(`   ❌ ${file} still uses mongoose`);
      allUsingPrisma = false;
      hasErrors = true;
    } else if (content.includes('prisma.')) {
      console.log(`   ✅ ${file} uses Prisma`);
    }
  });
  
  if (allUsingPrisma) {
    console.log('   ✅ All routes use Prisma');
  }
} else {
  console.log('   ⚠️  Routes directory not found');
}

// 6. Check .env.example
console.log('\n6️⃣ Checking .env.example...');
const envExamplePath = './backend/.env.example';
if (fs.existsSync(envExamplePath)) {
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  if (envContent.includes('DATABASE_URL')) {
    console.log('   ✅ DATABASE_URL in .env.example');
  } else {
    console.log('   ❌ DATABASE_URL not in .env.example');
    hasErrors = true;
  }
  
  if (envContent.includes('MONGODB') || envContent.includes('mongodb://')) {
    console.log('   ❌ MongoDB references in .env.example');
    hasErrors = true;
  } else {
    console.log('   ✅ No MongoDB references in .env.example');
  }
} else {
  console.log('   ⚠️  .env.example not found');
}

// 7. Check server.js
console.log('\n7️⃣ Checking server.js...');
const serverPath = './backend/server.js';
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  if (serverContent.includes('require(\'./lib/prisma\')') || serverContent.includes('require("./lib/prisma")')) {
    console.log('   ✅ Server uses Prisma');
  } else {
    console.log('   ⚠️  Server might not be using Prisma');
  }
  
  if (serverContent.includes('mongoose')) {
    console.log('   ❌ Server still references mongoose');
    hasErrors = true;
  } else {
    console.log('   ✅ No mongoose references in server');
  }
} else {
  console.log('   ❌ server.js not found');
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ VERIFICATION FAILED');
  console.log('\n⚠️  Please fix the issues above before proceeding.');
  process.exit(1);
} else {
  console.log('✅ VERIFICATION PASSED');
  console.log('\n🎉 Project is using MySQL (Prisma) only!');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: cd backend && npx prisma generate');
  console.log('   2. Run: cd backend && npx prisma migrate dev');
  console.log('   3. Run: cd backend && node create-admin.js');
  console.log('   4. Run: cd backend && npm run dev');
  process.exit(0);
}
