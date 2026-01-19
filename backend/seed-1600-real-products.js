const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// Multiple API sources for diverse products
const API_SOURCES = [
  {
    name: 'Platzi API',
    baseUrl: 'https://api.escuelajs.co/api/v1/products',
    limit: 200,
    transform: (product) => ({
      name: product.title,
      price: parseFloat(product.price),
      image: Array.isArray(product.images) ? product.images[0]?.replace(/[\[\]"]/g, '') : product.images,
      category: product.category?.name || 'General',
      brand: 'Platzi Store',
      productUrl: `https://api.escuelajs.co/api/v1/products/${product.id || ''}`
    })
  },
  {
    name: 'DummyJSON',
    baseUrl: 'https://dummyjson.com/products',
    limit: 194, // They have 194 products
    transform: (product) => ({
      name: product.title,
      price: parseFloat(product.price),
      image: product.thumbnail || product.images?.[0],
      category: product.category,
      brand: product.brand || 'DummyJSON',
      productUrl: `https://dummyjson.com/products/${product.id || ''}`
    })
  }
];

async function fetchFromAPI(source) {
  console.log(`\n📡 Fetching from ${source.name}...`);
  const products = [];
  
  try {
    if (source.name === 'Platzi API') {
      // Fetch with pagination
      let offset = 0;
      const limit = 50;
      
      while (products.length < source.limit) {
        const response = await axios.get(`${source.baseUrl}?offset=${offset}&limit=${limit}`, {
          timeout: 30000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const items = response.data;
        if (!items || items.length === 0) break;
        
        for (const item of items) {
          try {
            const transformed = source.transform(item);
            // Validate image URL
            if (transformed.image && 
                transformed.image.startsWith('http') && 
                !transformed.image.includes('[') &&
                transformed.name) {
              products.push(transformed);
            }
          } catch (e) {
            console.log(`⚠️  Skipped invalid product: ${e.message}`);
          }
        }
        
        offset += limit;
        if (items.length < limit) break;
      }
    }
    else if (source.name === 'DummyJSON') {
      // Fetch all products
      const response = await axios.get(`${source.baseUrl}?limit=0`, {
        timeout: 30000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      const items = response.data.products || [];
      
      for (const item of items.slice(0, source.limit)) {
        try {
          const transformed = source.transform(item);
          if (transformed.image && transformed.name) {
            products.push(transformed);
          }
        } catch (e) {
          console.log(`⚠️  Skipped invalid product: ${e.message}`);
        }
      }
    }
    
    console.log(`✅ Fetched ${products.length} products from ${source.name}`);
    return products;
  } catch (error) {
    console.error(`❌ Error fetching from ${source.name}:`, error.message);
    return [];
  }
}

// Generate additional products by creating variations
function generateVariations(baseProducts, targetCount) {
  console.log(`\n🔄 Generating variations to reach ${targetCount} products...`);
  const variations = [...baseProducts];
  
  const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Gray', 'Silver', 'Gold', 'Pink', 'Purple'];
  const adjectives = ['Premium', 'Deluxe', 'Pro', 'Elite', 'Classic', 'Modern', 'Vintage', 'Sport', 'Casual', 'Formal'];
  
  let index = 0;
  while (variations.length < targetCount && baseProducts.length > 0) {
    const base = baseProducts[index % baseProducts.length];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    
    // Create variation
    const variation = {
      ...base,
      name: `${adjective} ${base.name} - ${color}`,
      price: base.price * (0.9 + Math.random() * 0.3), // ±20% price variation
    };
    
    variations.push(variation);
    index++;
  }
  
  console.log(`✅ Generated ${variations.length} total products`);
  return variations.slice(0, targetCount);
}

async function seedProducts() {
  console.log('🌱 Starting to seed 1600 real products...\n');
  
  try {
    // Fetch from all sources
    const allProducts = [];
    
    for (const source of API_SOURCES) {
      const products = await fetchFromAPI(source);
      allProducts.push(...products);
      
      // Add delay between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 Total products fetched: ${allProducts.length}`);
    
    // Generate variations to reach 1600
    const targetProducts = generateVariations(allProducts, 1600);
    
    // Verify and insert products
    console.log('\n💾 Inserting products into database...');
    let inserted = 0;
    let failed = 0;
    
    for (let i = 0; i < targetProducts.length; i++) {
      const product = targetProducts[i];
      
      try {
        // Quick validation
        if (!product.image || !product.image.startsWith('http')) {
          failed++;
          continue;
        }
        
        await prisma.product.create({
          data: {
            name: product.name.substring(0, 255),
            price: Math.max(1, Math.round(product.price * 100) / 100),
            image: product.image,
            category: product.category || 'General',
            brand: product.brand || 'Generic',
            productUrl: product.productUrl || null,
            isActive: true,
          }
        });
        
        inserted++;
        
        if (inserted % 100 === 0) {
          console.log(`✅ Inserted ${inserted}/${targetProducts.length} products...`);
        }
      } catch (error) {
        failed++;
        if (failed <= 5 || failed % 50 === 0) {
          console.log(`⚠️  Failed product ${i}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n✅ Successfully inserted ${inserted} products`);
    console.log(`⚠️  Failed to insert ${failed} products`);
    console.log(`\n🎉 Seeding completed!`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProducts();
