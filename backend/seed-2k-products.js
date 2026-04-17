const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to generate random price
function randomPrice(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate product variations
function generateProductVariations(baseProduct, count) {
  const variations = [];
  const colors = ['Black', 'White', 'Blue', 'Red', 'Silver', 'Gold', 'Rose Gold', 'Navy', 'Gray', 'Green'];
  const sizes = ['Small', 'Medium', 'Large', 'XL', 'XXL'];
  const materials = ['Leather', 'Canvas', 'Nylon', 'Cotton', 'Polyester', 'Silk', 'Wool'];
  
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const material = materials[Math.floor(Math.random() * materials.length)];
    const priceVariation = Math.floor(Math.random() * 200) - 100; // +/- $100
    
    variations.push({
      ...baseProduct,
      name: `${baseProduct.name} - ${color} ${size}`,
      price: Math.max(baseProduct.price + priceVariation, 10),
    });
  }che
  
  return variations;
}

async function seed2kProducts() {
  console.log('🚀 Starting 2000 products seeding...');
  console.log('⏳ This may take a few minutes...\n');
  
  try {
    let totalAdded = 0;
    const batchSize = 100;

    // Category 1: Electronics & Gadgets (400 products)
    console.log('📱 Adding Electronics & Gadgets...');
    const electronics = [
      { name: 'iPhone 15 Pro Max', brand: 'Apple', category: 'Smartphones', price: 1199, image: 'https://images.unsplash.com/photo-1592286927505-2fd0d113e4e7?w=800&q=80' },
      { name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', category: 'Smartphones', price: 1299, image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80' },
      { name: 'MacBook Pro M3', brand: 'Apple', category: 'Laptops', price: 2499, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80' },
      { name: 'Dell XPS 15', brand: 'Dell', category: 'Laptops', price: 1899, image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80' },
      { name: 'iPad Pro 12.9', brand: 'Apple', category: 'Tablets', price: 1099, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80' },
      { name: 'Sony WH-1000XM5', brand: 'Sony', category: 'Headphones', price: 399, image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80' },
      { name: 'AirPods Pro 2', brand: 'Apple', category: 'Earbuds', price: 249, image: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800&q=80' },
      { name: 'Apple Watch Ultra 2', brand: 'Apple', category: 'Smartwatches', price: 799, image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800&q=80' },
      { name: 'Canon EOS R5', brand: 'Canon', category: 'Cameras', price: 3899, image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80' },
      { name: 'DJI Mavic 3 Pro', brand: 'DJI', category: 'Drones', price: 2199, image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80' },
    ];
    
    for (const product of electronics) {
      const variations = generateProductVariations(product, 40);
      for (let i = 0; i < variations.length; i += batchSize) {
        const batch = variations.slice(i, i + batchSize);
        await prisma.product.createMany({
          data: batch.map(p => ({ ...p, productUrl: 'https://example.com/product', isActive: true })),
          skipDuplicates: true,
        });
        totalAdded += batch.length;
        process.stdout.write(`\r   Progress: ${totalAdded}/2000 products`);
      }
    }

    // Category 2: Fashion & Apparel (400 products)
    console.log('\n👕 Adding Fashion & Apparel...');
    const fashion = [
      { name: 'Nike Air Max 270', brand: 'Nike', category: 'Sneakers', price: 150, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80' },
      { name: 'Adidas Ultraboost', brand: 'Adidas', category: 'Sneakers', price: 180, image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80' },
      { name: 'Levi\'s 501 Jeans', brand: 'Levi\'s', category: 'Jeans', price: 89, image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80' },
      { name: 'Ralph Lauren Polo Shirt', brand: 'Ralph Lauren', category: 'Shirts', price: 98, image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80' },
      { name: 'North Face Jacket', brand: 'The North Face', category: 'Jackets', price: 299, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80' },
      { name: 'Ray-Ban Aviator', brand: 'Ray-Ban', category: 'Sunglasses', price: 154, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80' },
      { name: 'Timberland Boots', brand: 'Timberland', category: 'Boots', price: 189, image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&q=80' },
      { name: 'Tommy Hilfiger Dress', brand: 'Tommy Hilfiger', category: 'Dresses', price: 129, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80' },
      { name: 'Calvin Klein Underwear', brand: 'Calvin Klein', category: 'Underwear', price: 45, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80' },
      { name: 'Patagonia Fleece', brand: 'Patagonia', category: 'Fleece', price: 149, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80' },
    ];
    
    for (const product of fashion) {
      const variations = generateProductVariations(product, 40);
      for (let i = 0; i < variations.length; i += batchSize) {
        const batch = variations.slice(i, i + batchSize);
        await prisma.product.createMany({
          data: batch.map(p => ({ ...p, productUrl: 'https://example.com/product', isActive: true })),
          skipDuplicates: true,
        });
        totalAdded += batch.length;
        process.stdout.write(`\r   Progress: ${totalAdded}/2000 products`);
      }
    }

    // Category 3: Luxury Watches & Jewelry (300 products)
    console.log('\n⌚ Adding Luxury Watches & Jewelry...');
    const luxury = [
      { name: 'Rolex Submariner', brand: 'Rolex', category: 'Watches', price: 12500, image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80' },
      { name: 'Omega Seamaster', brand: 'Omega', category: 'Watches', price: 5800, image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80' },
      { name: 'Cartier Love Bracelet', brand: 'Cartier', category: 'Jewelry', price: 6800, image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80' },
      { name: 'Tiffany Diamond Ring', brand: 'Tiffany & Co.', category: 'Jewelry', price: 8500, image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80' },
      { name: 'Patek Philippe Calatrava', brand: 'Patek Philippe', category: 'Watches', price: 28000, image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80' },
      { name: 'Bulgari Serpenti', brand: 'Bulgari', category: 'Jewelry', price: 4200, image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80' },
    ];
    
    for (const product of luxury) {
      const variations = generateProductVariations(product, 50);
      for (let i = 0; i < variations.length; i += batchSize) {
        const batch = variations.slice(i, i + batchSize);
        await prisma.product.createMany({
          data: batch.map(p => ({ ...p, productUrl: 'https://example.com/product', isActive: true })),
          skipDuplicates: true,
        });
        totalAdded += batch.length;
        process.stdout.write(`\r   Progress: ${totalAdded}/2000 products`);
      }
    }

    // Category 4: Designer Handbags (300 products)
    console.log('\n👜 Adding Designer Handbags...');
    const handbags = [
      { name: 'Louis Vuitton Neverfull', brand: 'Louis Vuitton', category: 'Handbags', price: 1850, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80' },
      { name: 'Gucci Marmont', brand: 'Gucci', category: 'Handbags', price: 2300, image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80' },
      { name: 'Chanel Classic Flap', brand: 'Chanel', category: 'Handbags', price: 8800, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80' },
      { name: 'Hermès Birkin', brand: 'Hermès', category: 'Handbags', price: 12000, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80' },
      { name: 'Prada Galleria', brand: 'Prada', category: 'Handbags', price: 3200, image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80' },
      { name: 'Dior Saddle Bag', brand: 'Dior', category: 'Handbags', price: 3500, image: 'https://images.unsplash.com/photo-1564422170194-896b89110ef8?w=800&q=80' },
    ];
    
    for (const product of handbags) {
      const variations = generateProductVariations(product, 50);
      for (let i = 0; i < variations.length; i += batchSize) {
        const batch = variations.slice(i, i + batchSize);
        await prisma.product.createMany({
          data: batch.map(p => ({ ...p, productUrl: 'https://example.com/product', isActive: true })),
          skipDuplicates: true,
        });
        totalAdded += batch.length;
        process.stdout.write(`\r   Progress: ${totalAdded}/2000 products`);
      }
    }

    // Category 5: Home & Living (300 products)
    console.log('\n🏠 Adding Home & Living...');
    const home = [
      { name: 'Dyson V15 Vacuum', brand: 'Dyson', category: 'Home Appliances', price: 649, image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80' },
      { name: 'KitchenAid Mixer', brand: 'KitchenAid', category: 'Kitchen', price: 449, image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80' },
      { name: 'Nespresso Machine', brand: 'Nespresso', category: 'Coffee Makers', price: 199, image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80' },
      { name: 'Le Creuset Dutch Oven', brand: 'Le Creuset', category: 'Cookware', price: 379, image: 'https://images.unsplash.com/photo-1584990347449-39b4aa02d0f8?w=800&q=80' },
      { name: 'Philips Hue Lights', brand: 'Philips', category: 'Smart Home', price: 199, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80' },
      { name: 'iRobot Roomba', brand: 'iRobot', category: 'Robot Vacuum', price: 599, image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80' },
    ];
    
    for (const product of home) {
      const variations = generateProductVariations(product, 50);
      for (let i = 0; i < variations.length; i += batchSize) {
        const batch = variations.slice(i, i + batchSize);
        await prisma.product.createMany({
          data: batch.map(p => ({ ...p, productUrl: 'https://example.com/product', isActive: true })),
          skipDuplicates: true,
        });
        totalAdded += batch.length;
        process.stdout.write(`\r   Progress: ${totalAdded}/2000 products`);
      }
    }

    // Category 6: Sports & Fitness (300 products)
    console.log('\n⚽ Adding Sports & Fitness...');
    const sports = [
      { name: 'Peloton Bike', brand: 'Peloton', category: 'Fitness Equipment', price: 1495, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' },
      { name: 'Nike Pro Leggings', brand: 'Nike', category: 'Activewear', price: 65, image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80' },
      { name: 'Lululemon Yoga Mat', brand: 'Lululemon', category: 'Yoga', price: 78, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80' },
      { name: 'Garmin Forerunner', brand: 'Garmin', category: 'Fitness Trackers', price: 349, image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80' },
      { name: 'TRX Suspension Trainer', brand: 'TRX', category: 'Training Equipment', price: 179, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' },
      { name: 'Bowflex Dumbbells', brand: 'Bowflex', category: 'Weights', price: 549, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' },
    ];
    
    for (const product of sports) {
      const variations = generateProductVariations(product, 50);
      for (let i = 0; i < variations.length; i += batchSize) {
        const batch = variations.slice(i, i + batchSize);
        await prisma.product.createMany({
          data: batch.map(p => ({ ...p, productUrl: 'https://example.com/product', isActive: true })),
          skipDuplicates: true,
        });
        totalAdded += batch.length;
        process.stdout.write(`\r   Progress: ${totalAdded}/2000 products`);
      }
    }

    console.log('\n\n✨ Seeding completed!');
    console.log(`📊 Total products added: ${totalAdded}`);
    console.log('🎉 Database now has 2000+ diverse products!');

  } catch (error) {
    console.error('\n❌ Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed2kProducts();
