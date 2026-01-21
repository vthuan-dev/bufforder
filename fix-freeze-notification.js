const fs = require('fs');

// Read the file
const filePath = './backend/routes/orders.js';
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the freeze notification section
const oldPattern = /freezeNotification: \{[^}]*title:[^,]*,[^}]*message:[^,]*,[^}]*frozenBalance:[^,]*,[^}]*orderStatus:[^,]*,[^}]*productPrice:[^,]*,[^}]*availableBalance:[^}]*\}/s;

const newCode = `freezeNotification: {
            // Send data for frontend to translate, not hardcoded text
            productPrice: randomProduct.price,
            availableBalance: user.balance,
            frozenBalance: user.balance,
            orderStatus: 'suspended'
          }`;

if (oldPattern.test(content)) {
  content = content.replace(oldPattern, newCode);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Successfully updated freeze notification in orders.js');
} else {
  console.log('❌ Pattern not found. Trying alternative approach...');
  
  // Alternative: find by line numbers
  const lines = content.split('\n');
  let startLine = -1;
  let endLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('freezeNotification: {')) {
      startLine = i;
    }
    if (startLine !== -1 && lines[i].includes('availableBalance: user.balance')) {
      endLine = i;
      break;
    }
  }
  
  if (startLine !== -1 && endLine !== -1) {
    console.log(`Found freeze notification from line ${startLine + 1} to ${endLine + 1}`);
    
    // Replace lines
    const newLines = [
      '          freezeNotification: {',
      '            // Send data for frontend to translate, not hardcoded text',
      '            productPrice: randomProduct.price,',
      '            availableBalance: user.balance,',
      '            frozenBalance: user.balance,',
      "            orderStatus: 'suspended'",
      '          }'
    ];
    
    lines.splice(startLine, endLine - startLine + 1, ...newLines);
    content = lines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Successfully updated freeze notification using line replacement');
  } else {
    console.log('❌ Could not find freeze notification section');
  }
}
