const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const fashionProducts = [
  // Luxury Watches (5 items)
  {
    name: "Rolex Submariner Date",
    brand: "Rolex",
    category: "Watches",
    price: 12500,
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80",
    productUrl: "https://www.rolex.com/watches/submariner",
    isActive: true
  },
  {
    name: "Omega Seamaster Diver 300M",
    brand: "Omega",
    category: "Watches",
    price: 5800,
    image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80",
    productUrl: "https://www.omegawatches.com/watches/seamaster",
    isActive: true
  },
  {
    name: "TAG Heuer Carrera Chronograph",
    brand: "TAG Heuer",
    category: "Watches",
    price: 4200,
    image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800&q=80",
    productUrl: "https://www.tagheuer.com/us/en/timepieces/collections/tag-heuer-carrera",
    isActive: true
  },
  {
    name: "Cartier Santos de Cartier",
    brand: "Cartier",
    category: "Watches",
    price: 7200,
    image: "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=800&q=80",
    productUrl: "https://www.cartier.com/en-us/watches/mens-watches/santos-de-cartier",
    isActive: true
  },
  {
    name: "Patek Philippe Calatrava",
    brand: "Patek Philippe",
    category: "Watches",
    price: 28000,
    image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80",
    productUrl: "https://www.patek.com/en/collection/calatrava",
    isActive: true
  },

  // Designer Handbags (5 items)
  {
    name: "Louis Vuitton Neverfull MM",
    brand: "Louis Vuitton",
    category: "Handbags",
    price: 1850,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
    productUrl: "https://us.louisvuitton.com/eng-us/products/neverfull-mm",
    isActive: true
  },
  {
    name: "Gucci Marmont Shoulder Bag",
    brand: "Gucci",
    category: "Handbags",
    price: 2300,
    image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80",
    productUrl: "https://www.gucci.com/us/en/pr/women/handbags/shoulder-bags-for-women",
    isActive: true
  },
  {
    name: "Chanel Classic Flap Bag",
    brand: "Chanel",
    category: "Handbags",
    price: 8800,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
    productUrl: "https://www.chanel.com/us/fashion/handbags",
    isActive: true
  },
  {
    name: "Hermès Birkin 30",
    brand: "Hermès",
    category: "Handbags",
    price: 12000,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
    productUrl: "https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods",
    isActive: true
  },
  {
    name: "Prada Galleria Saffiano",
    brand: "Prada",
    category: "Handbags",
    price: 3200,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80",
    productUrl: "https://www.prada.com/us/en/women/bags/top_handles",
    isActive: true
  },

  // Luxury Sneakers & Shoes (5 items)
  {
    name: "Nike Air Jordan 1 Retro High",
    brand: "Nike",
    category: "Sneakers",
    price: 180,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    productUrl: "https://www.nike.com/t/air-jordan-1-retro-high-og",
    isActive: true
  },
  {
    name: "Adidas Yeezy Boost 350 V2",
    brand: "Adidas",
    category: "Sneakers",
    price: 220,
    image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80",
    productUrl: "https://www.adidas.com/us/yeezy",
    isActive: true
  },
  {
    name: "Christian Louboutin Pigalle Follies",
    brand: "Christian Louboutin",
    category: "Heels",
    price: 795,
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80",
    productUrl: "https://us.christianlouboutin.com/us_en/shop/women/pigalle-follies.html",
    isActive: true
  },
  {
    name: "Balenciaga Triple S Sneakers",
    brand: "Balenciaga",
    category: "Sneakers",
    price: 1050,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
    productUrl: "https://www.balenciaga.com/en-us/triple-s-sneaker",
    isActive: true
  },
  {
    name: "Golden Goose Superstar Sneakers",
    brand: "Golden Goose",
    category: "Sneakers",
    price: 495,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    productUrl: "https://www.goldengoose.com/us/en/superstar",
    isActive: true
  },

  // Jewelry & Accessories (5 items)
  {
    name: "Tiffany & Co. T Smile Pendant",
    brand: "Tiffany & Co.",
    category: "Jewelry",
    price: 2100,
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
    productUrl: "https://www.tiffany.com/jewelry/necklaces-pendants",
    isActive: true
  },
  {
    name: "Cartier Love Bracelet",
    brand: "Cartier",
    category: "Jewelry",
    price: 6800,
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
    productUrl: "https://www.cartier.com/en-us/jewelry/bracelets/love-bracelet",
    isActive: true
  },
  {
    name: "Van Cleef & Arpels Alhambra Necklace",
    brand: "Van Cleef & Arpels",
    category: "Jewelry",
    price: 3850,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
    productUrl: "https://www.vancleefarpels.com/us/en/collections/jewelry/alhambra.html",
    isActive: true
  },
  {
    name: "Bulgari Serpenti Ring",
    brand: "Bulgari",
    category: "Jewelry",
    price: 4200,
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
    productUrl: "https://www.bulgari.com/en-us/jewelry/rings",
    isActive: true
  },
  {
    name: "David Yurman Cable Classics Bracelet",
    brand: "David Yurman",
    category: "Jewelry",
    price: 1250,
    image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80",
    productUrl: "https://www.davidyurman.com/products/womens/womens-bracelets",
    isActive: true
  }
];

async function seedFashionProducts() {
  console.log('🛍️  Starting fashion products seeding...');
  
  try {
    // Add fashion products
    console.log(`📦 Adding ${fashionProducts.length} fashion products...`);
    
    for (const product of fashionProducts) {
      await prisma.product.create({
        data: product
      });
      console.log(`✅ Added: ${product.name} - $${product.price}`);
    }

    console.log('\n✨ Fashion products seeding completed!');
    console.log(`📊 Total fashion products added: ${fashionProducts.length}`);
    
    // Show summary by category
    const categories = [...new Set(fashionProducts.map(p => p.category))];
    console.log('\n📋 Summary by category:');
    categories.forEach(cat => {
      const count = fashionProducts.filter(p => p.category === cat).length;
      console.log(`   ${cat}: ${count} items`);
    });

  } catch (error) {
    console.error('❌ Error seeding fashion products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedFashionProducts();
