/**
 * Seed Products - Import hardcoded products into database
 * Run: node seed-products.js
 */

const prisma = require('./lib/prisma');

const products = [
  { id: 1, name: "Rolex Submariner", brand: "Rolex", category: "Watches", image: "https://24kara.com/files/sanpham/4581/1/jpg/dong-ho-rolex-submariner-date-40-m116613lb-0005-116613lb-0005-thep-oystersteel-va-vang-kim-18ct-mat-xanh-luot.jpg", price: 8500 },
  { id: 2, name: "Omega Speedmaster", brand: "Omega", category: "Watches", image: "https://i.ebayimg.com/images/g/8QMAAeSw5YNoowXB/s-l1600.webp", price: 5500 },
  { id: 3, name: "Patek Philippe Calatrava", brand: "Patek Philippe", category: "Watches", image: "https://i.ebayimg.com/images/g/srcAAeSwXdlopIOi/s-l1600.webp", price: 25000 },
  { id: 4, name: "Audemars Piguet Royal Oak", brand: "Audemars Piguet", category: "Watches", image: "https://24kara.com/files/sanpham/31574/1/jpg/dong-ho-piaget-polo-perpetual-calendar-ultra-thin-g0a48006.jpg", price: 18000 },
  { id: 5, name: "Cartier Santos", brand: "Cartier", category: "Watches", image: "https://bizweb.dktcdn.net/100/175/988/products/wro16ms27rb21aa-1-copy.jpg?v=1722223341387", price: 7200 },
  { id: 6, name: "Hermès Birkin Bag", brand: "Hermès", category: "Handbags", image: "https://product.hstatic.net/200000465663/product/2b92308f-7d4c-4845-b8d3-7af5c333b83b_33d3cb42159a434a856ab0537f181c85_master.jpg", price: 15000 },
  { id: 7, name: "Chanel Classic Flap", brand: "Chanel", category: "Handbags", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=500&fit=crop", price: 8500 },
  { id: 8, name: "Balenciaga Triple S Sneakers", brand: "Balenciaga", category: "Shoes", image: "https://d3vfig6e0r0snz.cloudfront.net/rcYjnYuenaTH5vyDF/images/products/39728db5eed29247de6835853e910f6e.webp", price: 1200 },
  { id: 9, name: "Off-White Air Jordan 1", brand: "Off-White", category: "Shoes", image: "https://i.ebayimg.com/images/g/~mMAAOSwIY1oEIlQ/s-l1600.webp", price: 1800 },
  { id: 10, name: "Tiffany & Co. Diamond Ring", brand: "Tiffany & Co.", category: "Jewelry", image: "https://cdn.shopify.com/s/files/1/0097/1276/2940/products/Natural_Round_Cut_3_Row_Micro_Pave_Unique_Diamond_Engagement_Ring_Profile_View_White_Gold_Platinum_be378a38-79f3-4e1e-b901-ecaff3b22aa2.jpg?v=1651252990", price: 12000 },
  { id: 11, name: "Cartier Love Bracelet", brand: "Cartier", category: "Jewelry", image: "https://d3vfig6e0r0snz.cloudfront.net/rcYjnYuenaTH5vyDF/images/products/858aa5f08d22028bf064340dcada0b9a.webp", price: 8500 },
  { id: 12, name: "Hermès Silk Scarf", brand: "Hermès", category: "Accessories", image: "https://i.ebayimg.com/images/g/VowAAeSwgnBohkwK/s-l1600.webp", price: 450 },
  { id: 13, name: "Gucci GG Belt", brand: "Gucci", category: "Accessories", image: "https://i.ebayimg.com/images/g/l7EAAeSwSORodzog/s-l1600.webp", price: 650 },
  { id: 14, name: "Apple iPhone 17 Pro", brand: "Apple", category: "Electronics", image: "https://down-vn.img.susercontent.com/file/vn-11134207-820l4-megx9gfulgcmf4.webp", price: 1299 },
  { id: 15, name: "Samsung Galaxy S24 Ultra", brand: "Samsung", category: "Electronics", image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mdofu5fqmt2p5f.webp", price: 1199 },
  { id: 16, name: "Sony WH-1000XM5 Headphones", brand: "Sony", category: "Electronics", image: "https://songlongmedia.com/media/product/3123_untitled.jpg", price: 399 },
  { id: 17, name: "Dyson Supersonic Hair Dryer", brand: "Dyson", category: "Beauty", image: "https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/leap-petite-global/markets/vietnam/campaigns/pdp/hd16-kanzan-pink-case-storage-bag.png", price: 429 },
  { id: 18, name: "La Mer Moisturizing Cream", brand: "La Mer", category: "Beauty", image: "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lvyfnpdrsn2xba.webp", price: 345 },
];

async function seedProducts() {
  console.log('🌱 Seeding products...');
  
  try {
    // Clear existing products (optional - comment out if you want to keep existing)
    await prisma.product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert products
    for (const product of products) {
      await prisma.product.create({
        data: {
          name: product.name,
          brand: product.brand,
          category: product.category,
          price: product.price,
          image: product.image,
          isActive: true
        }
      });
      console.log(`✅ Created: ${product.name}`);
    }

    console.log(`\n🎉 Successfully seeded ${products.length} products!`);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedProducts();
