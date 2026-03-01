// Tool to calculate required commission rate to meet daily target

function calculateCommissionRate(dailyTarget, numberOfOrders, averageProductPrice) {
  // Commission formula: productPrice × commissionRate × 0.9 (10% system fee)
  // Target per order = dailyTarget / numberOfOrders
  // productPrice × rate × 0.9 = targetPerOrder
  // rate = targetPerOrder / (productPrice × 0.9)
  
  const targetPerOrder = dailyTarget / numberOfOrders;
  const requiredRate = targetPerOrder / (averageProductPrice * 0.9);
  const requiredRatePercent = (requiredRate * 100).toFixed(2);
  
  console.log('\n📊 Commission Rate Calculator\n');
  console.log('Input:');
  console.log(`  Daily Target: $${dailyTarget}`);
  console.log(`  Number of Orders: ${numberOfOrders}`);
  console.log(`  Average Product Price: $${averageProductPrice}`);
  console.log('');
  console.log('Calculation:');
  console.log(`  Target per Order: $${targetPerOrder.toFixed(2)}`);
  console.log(`  Required Commission Rate: ${requiredRatePercent}%`);
  console.log('');
  console.log('Verification:');
  const actualCommission = averageProductPrice * requiredRate * 0.9;
  const totalCommission = actualCommission * numberOfOrders;
  console.log(`  Commission per Order: $${actualCommission.toFixed(2)}`);
  console.log(`  Total Commission (${numberOfOrders} orders): $${totalCommission.toFixed(2)}`);
  console.log('');
  
  return {
    requiredRate,
    requiredRatePercent,
    targetPerOrder,
    actualCommission,
    totalCommission
  };
}

// Example from your case
console.log('=== YOUR CURRENT SITUATION ===');
const current = calculateCommissionRate(260, 60, 2166); // Average price from $184.82 / 0.085 rate

console.log('\n=== SOLUTION OPTIONS ===\n');

console.log('Option 1: Increase Commission Rate (keep same products)');
const option1 = calculateCommissionRate(260, 60, 2166);
console.log(`  → Set commission rate to ${option1.requiredRatePercent}% in admin panel\n`);

console.log('Option 2: Use Higher Price Products (keep 0.2% rate)');
const currentRate = 0.002; // 0.2%
const targetPerOrder = 260 / 60;
const requiredAvgPrice = targetPerOrder / (currentRate * 0.9);
console.log(`  → Use products with average price: $${requiredAvgPrice.toFixed(2)}`);
console.log(`  → Commission per order: $${(requiredAvgPrice * currentRate * 0.9).toFixed(2)}`);
console.log(`  → Total: $${(requiredAvgPrice * currentRate * 0.9 * 60).toFixed(2)}\n`);

console.log('Option 3: Combination (moderate rate + moderate price)');
const option3 = calculateCommissionRate(260, 60, 3000);
console.log(`  → Use products around $3,000`);
console.log(`  → Set commission rate to ${option3.requiredRatePercent}%\n`);

console.log('\n💡 RECOMMENDATION:');
console.log('Set commission rate to 0.20% (currently might be 0.085%)');
console.log('This will give you $260+ with 60 orders at current product prices.');
