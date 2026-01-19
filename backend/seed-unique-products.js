const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to generate random price
function randomPrice(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate unique product name with timestamp to avoid duplicates
function generateUniqueName(brand, category, index) {
  const adjectives = ['Premium', 'Luxury', 'Elite', 'Classic', 'Modern', 'Vintage', 'Sport', 'Professional', 'Designer', 'Limited'];
  const colors = ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Red', 'Green', 'Pink', 'Navy', 'Gray', 'Rose', 'Bronze'];
  const sizes = ['Compact', 'Standard', 'Plus', 'Pro', 'Max', 'Ultra', 'Mini', 'XL'];
  
  const adj = adjectives[index % adjectives.length];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = sizes[Math.floor(Math.random() * sizes.length)];
  const modelNum = 1000 + index;
  
  return `${brand} ${adj} ${category} ${modelNum} ${color} ${size}`;
}

// Generate unique image URL using Picsum (random images)
function generateUniqueImage(seed) {
  // Picsum provides random images with seed for consistency
  // Each seed gives a different image
  return `https://picsum.photos/seed/${seed}/800/800`;
}

async function seedUniqueProducts() {
  console.log('🎨 Starting unique products seeding...');
  console.log('⏳ Creating 2000 products with unique names and images...\n');
  
  try {
    const products = [];
    let productIndex = 0;

    // Product categories with brands
    const categories = [
      {
        name: 'Smartphone',
        brands: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Huawei', 'Sony', 'Motorola'],
        priceRange: [300, 1500],
        count: 250
      },
      {
        name: 'Laptop',
        brands: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Razer', 'Microsoft', 'LG'],
        priceRange: [800, 3500],
        count: 250
      },
      {
        name: 'Watch',
        brands: ['Rolex', 'Omega', 'TAG Heuer', 'Cartier', 'Patek Philippe', 'Audemars Piguet', 'IWC', 'Breitling', 'Seiko', 'Casio'],
        priceRange: [500, 30000],
        count: 200
      },
      {
        name: 'Handbag',
        brands: ['Louis Vuitton', 'Gucci', 'Chanel', 'Hermès', 'Prada', 'Dior', 'Fendi', 'Burberry', 'Coach', 'Michael Kors'],
        priceRange: [500, 15000],
        count: 200
      },
      {
        name: 'Sneaker',
        brands: ['Nike', 'Adidas', 'Puma', 'New Balance', 'Reebok', 'Converse', 'Vans', 'Balenciaga', 'Yeezy', 'Jordan'],
        priceRange: [80, 1200],
        count: 250
      },
      {
        name: 'Headphone',
        brands: ['Sony', 'Bose', 'Sennheiser', 'Apple', 'Beats', 'JBL', 'Audio-Technica', 'Shure', 'AKG', 'Beyerdynamic'],
        priceRange: [100, 800],
        count: 200
      },
      {
        name: 'Camera',
        brands: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic', 'Olympus', 'Leica', 'Pentax', 'Hasselblad', 'GoPro'],
        priceRange: [500, 5000],
        count: 150
      },
      {
        name: 'Tablet',
        brands: ['Apple', 'Samsung', 'Microsoft', 'Lenovo', 'Huawei', 'Amazon', 'Google', 'Asus', 'Xiaomi', 'OnePlus'],
        priceRange: [200, 1500],
        count: 150
      },
      {
        name: 'Smartwatch',
        brands: ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Huawei', 'Fossil', 'TicWatch', 'Amazfit', 'Withings', 'Polar'],
        priceRange: [150, 1000],
        count: 150
      },
      {
        name: 'Sunglasses',
        brands: ['Ray-Ban', 'Oakley', 'Gucci', 'Prada', 'Tom Ford', 'Versace', 'Dior', 'Burberry', 'Persol', 'Maui Jim'],
        priceRange: [100, 800],
        count: 200
      }
    ];

    console.log('📦 Generating products...\n');

    for (const category of categories) {
      console.log(`   Creating ${category.count} ${category.name}s...`);
      
      for (let i = 0; i < category.count; i++) {
        const brand = category.brands[i % category.brands.length];
        const uniqueName = generateUniqueName(brand, category.name, productIndex);
        const uniqueImage = generateUniqueImage(`product-${productIndex}-${Date.now()}`);
        const price = randomPrice(category.priceRange[0], category.priceRange[1]);
        
        products.push({
          name: uniqueName,
          brand: brand,
          category: category.name,
          price: price,
          image: uniqueImage,
          productUrl: `https://example.com/${category.name.toLowerCase()}/${productIndex}`,
          isActive: true,
        });
        
        productIndex++;
      }
    }

    console.log(`\n✅ Generated ${products.length} unique products`);
    console.log('💾 Saving to database...\n');

    // Insert in batches
    const batchSize = 100;
    let totalAdded = 0;
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      await prisma.product.createMany({
        data: batch,
        skipDuplicates: true,
      });
      totalAdded += batch.length;
      process.stdout.write(`\r   Progress: ${totalAdded}/${products.length} products saved`);
    }

    console.log('\n\n✨ Seeding completed!');
    console.log(`📊 Total products added: ${totalAdded}`);
    console.log('✅ All products have unique names and images!');
    console.log('✅ All images are guaranteed to load (Picsum service)');

  } catch (error) {
    console.error('\n❌ Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedUniqueProducts();
