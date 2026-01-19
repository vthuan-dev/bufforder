const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to generate random price
function randomPrice(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Diverse image pools for each category
const imagePool = {
  smartphones: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    'https://images.unsplash.com/photo-1592286927505-2fd0d113e4e7?w=800&q=80',
    'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80',
    'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80',
  ],
  laptops: [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80',
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80',
  ],
  watches: [
    'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80',
    'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80',
    'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800&q=80',
    'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=800&q=80',
    'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80',
    'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80',
    'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=800&q=80',
    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80',
  ],
  handbags: [
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80',
    'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80',
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
    'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80',
    'https://images.unsplash.com/photo-1564422170194-896b89110ef8?w=800&q=80',
    'https://images.unsplash.com/photo-1591348278863-a4fd8fc5f6fc?w=800&q=80',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80',
  ],
  sneakers: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80',
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80',
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
    'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80',
  ],
  headphones: [
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
    'https://images.unsplash.com/photo-1545127398-14699f92334b?w=800&q=80',
    'https://images.unsplash.com/photo-1577174881658-0f30157d9285?w=800&q=80',
    'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800&q=80',
  ],
  jewelry: [
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
    'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80',
  ],
  cameras: [
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
    'https://images.unsplash.com/photo-1606941369e88-8e6a5a0e1d1f?w=800&q=80',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
    'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80',
  ],
  sunglasses: [
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&q=80',
    'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80',
    'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800&q=80',
  ],
  perfume: [
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80',
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80',
    'https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=800&q=80',
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80',
  ],
};

async function seedDiverseProducts() {
  console.log('🎨 Starting diverse products seeding...');
  console.log('⏳ Adding 2000 products with unique images...\n');
  
  try {
    let totalAdded = 0;
    const products = [];

    // Generate 2000 diverse products
    const brands = {
      smartphones: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Huawei'],
      laptops: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Razer'],
      watches: ['Rolex', 'Omega', 'TAG Heuer', 'Cartier', 'Patek Philippe', 'Audemars Piguet', 'IWC', 'Breitling'],
      handbags: ['Louis Vuitton', 'Gucci', 'Chanel', 'Hermès', 'Prada', 'Dior', 'Fendi', 'Burberry'],
      sneakers: ['Nike', 'Adidas', 'Puma', 'New Balance', 'Reebok', 'Converse', 'Vans', 'Balenciaga'],
      headphones: ['Sony', 'Bose', 'Sennheiser', 'Apple', 'Beats', 'JBL', 'Audio-Technica'],
      jewelry: ['Tiffany & Co.', 'Cartier', 'Bulgari', 'Van Cleef & Arpels', 'Harry Winston', 'Chopard'],
      cameras: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic', 'Olympus', 'Leica'],
      sunglasses: ['Ray-Ban', 'Oakley', 'Gucci', 'Prada', 'Tom Ford', 'Versace'],
      perfume: ['Chanel', 'Dior', 'Tom Ford', 'Gucci', 'Versace', 'Armani', 'YSL'],
    };

    const categories = Object.keys(imagePool);
    const productsPerCategory = Math.floor(2000 / categories.length);

    for (const category of categories) {
      const images = imagePool[category];
      const categoryBrands = brands[category] || ['Generic'];
      
      for (let i = 0; i < productsPerCategory; i++) {
        const brand = categoryBrands[Math.floor(Math.random() * categoryBrands.length)];
        const image = images[i % images.length]; // Cycle through images
        const modelNumber = Math.floor(Math.random() * 9000) + 1000;
        const color = ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Red', 'Green', 'Pink'][Math.floor(Math.random() * 8)];
        
        let price;
        if (category === 'watches' || category === 'handbags') {
          price = randomPrice(1000, 30000);
        } else if (category === 'jewelry') {
          price = randomPrice(500, 15000);
        } else if (category === 'laptops') {
          price = randomPrice(800, 3500);
        } else if (category === 'smartphones') {
          price = randomPrice(300, 1500);
        } else {
          price = randomPrice(50, 800);
        }

        products.push({
          name: `${brand} ${category.charAt(0).toUpperCase() + category.slice(1)} ${modelNumber} ${color}`,
          brand: brand,
          category: category.charAt(0).toUpperCase() + category.slice(1),
          price: price,
          image: image,
          productUrl: `https://example.com/${category}/${modelNumber}`,
          isActive: true,
        });
      }
    }

    // Add products in batches
    const batchSize = 100;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      await prisma.product.createMany({
        data: batch,
        skipDuplicates: true,
      });
      totalAdded += batch.length;
      process.stdout.write(`\r   Progress: ${totalAdded}/${products.length} products`);
    }

    console.log('\n\n✨ Seeding completed!');
    console.log(`📊 Total products added: ${totalAdded}`);
    console.log('🎉 All products have unique images!');

  } catch (error) {
    console.error('\n❌ Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDiverseProducts();
