/**
 * Seed 2000 Products with WORKING Images
 * Uses picsum.photos for reliable, high-quality product images
 */

const prisma = require('./lib/prisma');

// Real product data with realistic names and prices
const productTemplates = {
  smartphones: {
    brands: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Realme'],
    models: ['Pro Max', 'Ultra', 'Plus', 'Pro', 'Standard', 'Lite', 'SE', 'Mini'],
    priceRange: [299, 1499]
  },
  laptops: {
    brands: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Razer'],
    models: ['Pro', 'XPS', 'ThinkPad', 'Pavilion', 'Inspiron', 'ROG', 'Predator', 'Swift'],
    priceRange: [499, 2999]
  },
  watches: {
    brands: ['Rolex', 'Omega', 'TAG Heuer', 'Cartier', 'Patek Philippe', 'Audemars Piguet', 'Breitling', 'IWC'],
    models: ['Classic', 'Sport', 'Chronograph', 'Automatic', 'Diver', 'GMT', 'Moonphase'],
    priceRange: [2000, 25000]
  },
  handbags: {
    brands: ['Hermès', 'Chanel', 'Louis Vuitton', 'Gucci', 'Prada', 'Dior', 'Fendi', 'Balenciaga'],
    models: ['Tote', 'Shoulder', 'Crossbody', 'Clutch', 'Satchel', 'Hobo', 'Bucket'],
    priceRange: [800, 15000]
  },
  sneakers: {
    brands: ['Nike', 'Adidas', 'New Balance', 'Puma', 'Reebok', 'Converse', 'Vans', 'Asics'],
    models: ['Air Max', 'Boost', '990', 'Suede', 'Classic', 'Old Skool', 'Gel', 'Chuck'],
    priceRange: [80, 350]
  },
  headphones: {
    brands: ['Sony', 'Bose', 'Sennheiser', 'Audio-Technica', 'Beats', 'JBL', 'AKG', 'Beyerdynamic'],
    models: ['WH-1000XM5', 'QuietComfort', 'Momentum', 'ATH-M50x', 'Studio3', 'Live', 'K701'],
    priceRange: [99, 499]
  },
  cameras: {
    brands: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic', 'Olympus', 'Leica', 'Pentax'],
    models: ['EOS', 'Z Series', 'Alpha', 'X-T', 'Lumix', 'OM-D', 'Q2', 'K-1'],
    priceRange: [599, 3999]
  },
  tablets: {
    brands: ['Apple', 'Samsung', 'Microsoft', 'Lenovo', 'Amazon', 'Huawei', 'Xiaomi'],
    models: ['iPad Pro', 'Galaxy Tab', 'Surface', 'Tab P', 'Fire HD', 'MatePad', 'Pad'],
    priceRange: [199, 1299]
  },
  smartwatches: {
    brands: ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Fossil', 'Huawei', 'Amazfit', 'TicWatch'],
    models: ['Watch Ultra', 'Galaxy Watch', 'Fenix', 'Sense', 'Gen 6', 'Watch GT', 'GTR'],
    priceRange: [149, 899]
  },
  sunglasses: {
    brands: ['Ray-Ban', 'Oakley', 'Persol', 'Maui Jim', 'Tom Ford', 'Prada', 'Gucci', 'Versace'],
    models: ['Aviator', 'Wayfarer', 'Clubmaster', 'Round', 'Cat Eye', 'Square', 'Oversized'],
    priceRange: [89, 599]
  }
};

// Generate unique image URL using picsum.photos
function generateImageUrl(index) {
  // Use different seed for each product to get unique images
  const seed = 1000 + index;
  return `https://picsum.photos/seed/${seed}/800/800`;
}

// Generate realistic product
function generateProduct(category, categoryData, index) {
  const brand = categoryData.brands[Math.floor(Math.random() * categoryData.brands.length)];
  const model = categoryData.models[Math.floor(Math.random() * categoryData.models.length)];
  const year = Math.random() > 0.5 ? '2024' : '2025';
  const edition = ['', 'Limited Edition', 'Special Edition', 'Anniversary Edition'][Math.floor(Math.random() * 4)];
  
  const name = `${brand} ${model} ${edition} ${year}`.trim().replace(/\s+/g, ' ');
  const price = Math.round(
    categoryData.priceRange[0] + 
    Math.random() * (categoryData.priceRange[1] - categoryData.priceRange[0])
  );
  
  return {
    name: `${name} #${index}`,
    brand,
    category: category.charAt(0).toUpperCase() + category.slice(1),
    price,
    image: generateImageUrl(index),
    productUrl: `https://example.com/products/${category}/${index}`,
    isActive: true
  };
}

async function seedProducts() {
  console.log('🌱 Generating 2000 products with working images...');
  
  try {
    // Clear existing products
    console.log('🗑️  Clearing existing products...');
    await prisma.product.deleteMany({});
    console.log('✅ Cleared existing products');
    
    // Generate products
    const allProducts = [];
    const categories = Object.keys(productTemplates);
    const productsPerCategory = Math.ceil(2000 / categories.length);
    
    let index = 0;
    for (const category of categories) {
      console.log(`📦 Generating ${productsPerCategory} ${category}...`);
      for (let i = 0; i < productsPerCategory && index < 2000; i++) {
        allProducts.push(generateProduct(category, productTemplates[category], index));
        index++;
      }
    }
    
    console.log(`✅ Generated ${allProducts.length} products`);
    
    // Insert in batches
    console.log('💾 Inserting products in batches...');
    const batchSize = 100;
    for (let i = 0; i < allProducts.length; i += batchSize) {
      const batch = allProducts.slice(i, i + batchSize);
      await prisma.product.createMany({ data: batch });
      const progress = Math.round((i + batch.length) / allProducts.length * 100);
      console.log(`✅ Progress: ${progress}% (${i + batch.length}/${allProducts.length})`);
    }
    
    console.log(`\n🎉 Successfully seeded ${allProducts.length} products!`);
    
    // Show statistics
    const stats = await prisma.product.groupBy({
      by: ['category'],
      _count: true
    });
    
    console.log('\n📊 Products by category:');
    stats.forEach(s => console.log(`  ${s.category}: ${s._count} products`));
    
    // Show sample
    const sample = await prisma.product.findMany({ take: 5 });
    console.log('\n📦 Sample products:');
    sample.forEach(p => console.log(`  - ${p.name} ($${p.price})`));
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedProducts();
