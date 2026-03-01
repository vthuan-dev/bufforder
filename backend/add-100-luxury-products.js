/**
 * Add 100 Luxury Products ($1,000 - $30,000)
 * Real brands, real prices, real product names
 * This will ADD to existing products (not delete)
 */

const prisma = require('./lib/prisma');

const luxuryProducts = [
  // Ultra Luxury Watches ($8,000 - $30,000)
  { name: "Rolex Submariner Date 41mm Steel Black", brand: "Rolex", category: "Watches", price: 14300, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  { name: "Patek Philippe Calatrava 5227G White Gold", brand: "Patek Philippe", category: "Watches", price: 28500, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  { name: "Audemars Piguet Royal Oak 41mm Steel Blue", brand: "Audemars Piguet", category: "Watches", price: 27800, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  { name: "Omega Speedmaster Moonwatch Professional Chronograph", brand: "Omega", category: "Watches", price: 6800, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  { name: "TAG Heuer Carrera Calibre Heuer 02 Chronograph", brand: "TAG Heuer", category: "Watches", price: 5900, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  { name: "Breitling Navitimer B01 Chronograph 43 Steel", brand: "Breitling", category: "Watches", price: 8900, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  { name: "IWC Portugieser Automatic 40mm Stainless Steel", brand: "IWC", category: "Watches", price: 12500, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  { name: "Cartier Santos de Cartier Large Steel Gold", brand: "Cartier", category: "Watches", price: 7600, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  { name: "Jaeger-LeCoultre Reverso Classic Medium Duoface", brand: "Jaeger-LeCoultre", category: "Watches", price: 9800, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  { name: "Vacheron Constantin Overseas Automatic Blue Dial", brand: "Vacheron Constantin", category: "Watches", price: 24500, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  
  // Luxury Handbags ($2,000 - $15,000)
  { name: "Hermès Birkin 30 Togo Leather Black Gold Hardware", brand: "Hermès", category: "Handbags", price: 12500, image: "https://cdn.dummyjson.com/products/images/womens-bags/Heshe%20Women's%20Leather%20Bag/1.png" },
  { name: "Chanel Classic Flap Medium Caviar Leather Black", brand: "Chanel", category: "Handbags", price: 9200, image: "https://cdn.dummyjson.com/products/images/womens-bags/Heshe%20Women's%20Leather%20Bag/1.png" },
  { name: "Louis Vuitton Neverfull MM Monogram Canvas", brand: "Louis Vuitton", category: "Handbags", price: 2100, image: "https://cdn.dummyjson.com/products/images/womens-bags/Heshe%20Women's%20Leather%20Bag/1.png" },
  { name: "Gucci Dionysus GG Supreme Medium Shoulder Bag", brand: "Gucci", category: "Handbags", price: 3200, image: "https://cdn.dummyjson.com/products/images/womens-bags/Heshe%20Women's%20Leather%20Bag/1.png" },
  { name: "Prada Galleria Saffiano Leather Bag Medium Black", brand: "Prada", category: "Handbags", price: 3600, image: "https://cdn.dummyjson.com/products/images/womens-bags/Heshe%20Women's%20Leather%20Bag/1.png" },
  { name: "Dior Lady Dior Medium Cannage Lambskin", brand: "Dior", category: "Handbags", price: 5800, image: "https://cdn.dummyjson.com/products/images/womens-bags/Heshe%20Women's%20Leather%20Bag/1.png" },
  { name: "Bottega Veneta Intrecciato Cabat Tote Large", brand: "Bottega Veneta", category: "Handbags", price: 7200, image: "https://cdn.dummyjson.com/products/images/womens-bags/Heshe%20Women's%20Leather%20Bag/1.png" },
  { name: "Fendi Peekaboo ISeeU Medium Leather Bag", brand: "Fendi", category: "Handbags", price: 4900, image: "https://cdn.dummyjson.com/products/images/womens-bags/Heshe%20Women's%20Leather%20Bag/1.png" },
  { name: "Saint Laurent Sac de Jour Small Grained Leather", brand: "Saint Laurent", category: "Handbags", price: 2950, image: "https://cdn.dummyjson.com/products/images/womens-bags/Heshe%20Women's%20Leather%20Bag/1.png" },
  { name: "Celine Luggage Micro Drummed Calfskin", brand: "Celine", category: "Handbags", price: 3400, image: "https://cdn.dummyjson.com/products/images/womens-bags/Heshe%20Women's%20Leather%20Bag/1.png" },
  
  // High-End Jewelry ($3,000 - $20,000)
  { name: "Tiffany & Co. Soleste Diamond Engagement Ring 1.5ct", brand: "Tiffany & Co.", category: "Jewelry", price: 15800, image: "https://cdn.dummyjson.com/products/images/womens-jewellery/Green%20Crystal%20Earring/1.png" },
  { name: "Cartier Love Bracelet 18K Yellow Gold Size 17", brand: "Cartier", category: "Jewelry", price: 7350, image: "https://cdn.dummyjson.com/products/images/womens-jewellery/Green%20Crystal%20Earring/1.png" },
  { name: "Van Cleef & Arpels Vintage Alhambra Necklace 10 Motifs", brand: "Van Cleef & Arpels", category: "Jewelry", price: 4200, image: "https://cdn.dummyjson.com/products/images/womens-jewellery/Green%20Crystal%20Earring/1.png" },
  { name: "Bulgari B.zero1 Ring 18K White Gold 4-Band", brand: "Bulgari", category: "Jewelry", price: 3800, image: "https://cdn.dummyjson.com/products/images/womens-jewellery/Green%20Crystal%20Earring/1.png" },
  { name: "Harry Winston Diamond Stud Earrings 2.00ct Total", brand: "Harry Winston", category: "Jewelry", price: 18500, image: "https://cdn.dummyjson.com/products/images/womens-jewellery/Green%20Crystal%20Earring/1.png" },
  { name: "Chopard Happy Diamonds Pendant White Gold", brand: "Chopard", category: "Jewelry", price: 5600, image: "https://cdn.dummyjson.com/products/images/womens-jewellery/Green%20Crystal%20Earring/1.png" },
  { name: "Graff Diamond Tennis Bracelet 10ct", brand: "Graff", category: "Jewelry", price: 28000, image: "https://cdn.dummyjson.com/products/images/womens-jewellery/Green%20Crystal%20Earring/1.png" },
  { name: "Piaget Possession Ring 18K Rose Gold Diamond", brand: "Piaget", category: "Jewelry", price: 4500, image: "https://cdn.dummyjson.com/products/images/womens-jewellery/Green%20Crystal%20Earring/1.png" },
  { name: "Boucheron Quatre Radiant Edition Ring White Gold", brand: "Boucheron", category: "Jewelry", price: 3900, image: "https://cdn.dummyjson.com/products/images/womens-jewellery/Green%20Crystal%20Earring/1.png" },
  { name: "Mikimoto Akoya Pearl Necklace 18K White Gold", brand: "Mikimoto", category: "Jewelry", price: 6800, image: "https://cdn.dummyjson.com/products/images/womens-jewellery/Green%20Crystal%20Earring/1.png" },
  
  // Premium Electronics & Audio ($1,000 - $28,000)
  { name: "Apple Mac Pro M2 Ultra 24-Core 64GB RAM 1TB SSD", brand: "Apple", category: "Electronics", price: 6999, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "Apple MacBook Pro 16 M3 Max 128GB RAM 8TB SSD", brand: "Apple", category: "Electronics", price: 7199, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "Microsoft Surface Studio 2+ i7-11370H 32GB 1TB", brand: "Microsoft", category: "Electronics", price: 4499, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "Samsung 85 Neo QLED 8K QN900C Smart TV", brand: "Samsung", category: "Electronics", price: 5499, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "LG 83 OLED evo C3 4K Smart TV with Magic Remote", brand: "LG", category: "Electronics", price: 4999, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "Sony A95L 77 QD-OLED 4K HDR Smart TV", brand: "Sony", category: "Electronics", price: 5999, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "Bowers & Wilkins 800 D4 Diamond Dome Speakers Pair", brand: "Bowers & Wilkins", category: "Electronics", price: 28000, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "McIntosh MC462 Stereo Power Amplifier 450W", brand: "McIntosh", category: "Electronics", price: 12000, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "Bang & Olufsen Beosound Theatre Soundbar", brand: "Bang & Olufsen", category: "Electronics", price: 8990, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "Naim Mu-so 2nd Generation Wireless Speaker", brand: "Naim", category: "Electronics", price: 1590, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  
  // Professional Cameras ($2,000 - $16,000)
  { name: "Canon EOS R5 C Cinema Camera Body 8K", brand: "Canon", category: "Camera", price: 4499, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "Sony Alpha 1 Full-Frame Mirrorless 50.1MP", brand: "Sony", category: "Camera", price: 6498, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "Nikon Z9 Full-Frame Mirrorless 45.7MP", brand: "Nikon", category: "Camera", price: 5496, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "Leica Q3 Full-Frame Compact Camera 60MP", brand: "Leica", category: "Camera", price: 5995, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "Hasselblad X2D 100C Medium Format 100MP", brand: "Hasselblad", category: "Camera", price: 8199, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "DJI Inspire 3 Professional Drone with Zenmuse X9", brand: "DJI", category: "Camera", price: 16499, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "Fujifilm GFX 100 II Medium Format 102MP", brand: "Fujifilm", category: "Camera", price: 7499, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "Phase One XF IQ4 150MP Camera System", brand: "Phase One", category: "Camera", price: 28990, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "RED Komodo 6K Cinema Camera", brand: "RED", category: "Camera", price: 5995, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  { name: "ARRI Alexa Mini LF Large Format Camera", brand: "ARRI", category: "Camera", price: 29500, image: "https://cdn.dummyjson.com/products/images/laptops/Apple%20MacBook%20Pro%2014%20Inch%20Space%20Grey/1.png" },
  
  // Luxury Fashion ($1,000 - $6,000)
  { name: "Canada Goose Snow Mantra Parka Black Label", brand: "Canada Goose", category: "Fashion", price: 1895, image: "https://cdn.dummyjson.com/products/images/mens-shirts/Man%20Plaid%20Shirt/1.png" },
  { name: "Moncler Grenoble Ski Jacket Down Filled", brand: "Moncler", category: "Fashion", price: 2450, image: "https://cdn.dummyjson.com/products/images/mens-shirts/Man%20Plaid%20Shirt/1.png" },
  { name: "Burberry Heritage Trench Coat Kensington Fit", brand: "Burberry", category: "Fashion", price: 2290, image: "https://cdn.dummyjson.com/products/images/mens-shirts/Man%20Plaid%20Shirt/1.png" },
  { name: "Tom Ford Shelton Velvet Dinner Jacket Black", brand: "Tom Ford", category: "Fashion", price: 4980, image: "https://cdn.dummyjson.com/products/images/mens-shirts/Man%20Plaid%20Shirt/1.png" },
  { name: "Loro Piana Cashmere Overcoat Storm System", brand: "Loro Piana", category: "Fashion", price: 5800, image: "https://cdn.dummyjson.com/products/images/mens-shirts/Man%20Plaid%20Shirt/1.png" },
  { name: "Christian Louboutin So Kate 120mm Pumps Black Patent", brand: "Christian Louboutin", category: "Fashion", price: 795, image: "https://cdn.dummyjson.com/products/images/womens-shoes/Black%20&%20Brown%20Slipper/1.png" },
  { name: "Balenciaga Triple S Clear Sole Sneakers White", brand: "Balenciaga", category: "Fashion", price: 1090, image: "https://cdn.dummyjson.com/products/images/womens-shoes/Black%20&%20Brown%20Slipper/1.png" },
  { name: "Golden Goose Super-Star Distressed Leather Sneakers", brand: "Golden Goose", category: "Fashion", price: 560, image: "https://cdn.dummyjson.com/products/images/womens-shoes/Black%20&%20Brown%20Slipper/1.png" },
  { name: "Brunello Cucinelli Cashmere Suit Two-Piece", brand: "Brunello Cucinelli", category: "Fashion", price: 5200, image: "https://cdn.dummyjson.com/products/images/mens-shirts/Man%20Plaid%20Shirt/1.png" },
  { name: "Kiton Napoli Hand-Made Suit Super 180s Wool", brand: "Kiton", category: "Fashion", price: 6800, image: "https://cdn.dummyjson.com/products/images/mens-shirts/Man%20Plaid%20Shirt/1.png" },
  
  // Premium Home & Lifestyle ($1,000 - $15,000)
  { name: "Herman Miller Eames Lounge Chair & Ottoman Walnut", brand: "Herman Miller", category: "Home", price: 6495, image: "https://cdn.dummyjson.com/products/images/furniture/Annibale%20Colombo%20Bed/1.png" },
  { name: "Peloton Bike+ Premium Package with Accessories", brand: "Peloton", category: "Home", price: 2495, image: "https://cdn.dummyjson.com/products/images/furniture/Annibale%20Colombo%20Bed/1.png" },
  { name: "Technogym Kinesis Personal Vision Home Gym", brand: "Technogym", category: "Home", price: 8900, image: "https://cdn.dummyjson.com/products/images/furniture/Annibale%20Colombo%20Bed/1.png" },
  { name: "La Marzocco Linea Mini Espresso Machine Red", brand: "La Marzocco", category: "Home", price: 5900, image: "https://cdn.dummyjson.com/products/images/furniture/Annibale%20Colombo%20Bed/1.png" },
  { name: "Sub-Zero 48 Built-In Side-by-Side Refrigerator", brand: "Sub-Zero", category: "Home", price: 14999, image: "https://cdn.dummyjson.com/products/images/furniture/Annibale%20Colombo%20Bed/1.png" },
  { name: "Wolf 48 Dual Fuel Range 6 Burners Stainless Steel", brand: "Wolf", category: "Home", price: 12995, image: "https://cdn.dummyjson.com/products/images/furniture/Annibale%20Colombo%20Bed/1.png" },
  { name: "Miele Complete C3 Calima Canister Vacuum Cleaner", brand: "Miele", category: "Home", price: 1399, image: "https://cdn.dummyjson.com/products/images/furniture/Annibale%20Colombo%20Bed/1.png" },
  { name: "Dyson Purifier Hot+Cool Formaldehyde HP09 White", brand: "Dyson", category: "Home", price: 949, image: "https://cdn.dummyjson.com/products/images/furniture/Annibale%20Colombo%20Bed/1.png" },
  { name: "Vitamix Ascent A3500 Smart Blender Brushed Steel", brand: "Vitamix", category: "Home", price: 649, image: "https://cdn.dummyjson.com/products/images/furniture/Annibale%20Colombo%20Bed/1.png" },
  { name: "Breville Oracle Touch Espresso Machine", brand: "Breville", category: "Home", price: 2499, image: "https://cdn.dummyjson.com/products/images/furniture/Annibale%20Colombo%20Bed/1.png" },
  
  // Luxury Accessories ($500 - $5,000)
  { name: "Montblanc Meisterstück 149 Fountain Pen 18K Gold Nib", brand: "Montblanc", category: "Accessories", price: 1050, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  { name: "Ray-Ban Aviator Classic Gold Frame Green Lens", brand: "Ray-Ban", category: "Accessories", price: 189, image: "https://cdn.dummyjson.com/products/images/sunglasses/Classic%20Sun%20Glasses/1.png" },
  { name: "Persol PO0649 Folding Sunglasses Havana", brand: "Persol", category: "Accessories", price: 350, image: "https://cdn.dummyjson.com/products/images/sunglasses/Classic%20Sun%20Glasses/1.png" },
  { name: "Tom Ford Henry Sunglasses Shiny Black", brand: "Tom Ford", category: "Accessories", price: 495, image: "https://cdn.dummyjson.com/products/images/sunglasses/Classic%20Sun%20Glasses/1.png" },
  { name: "Maui Jim Peahi Polarized Sunglasses", brand: "Maui Jim", category: "Accessories", price: 329, image: "https://cdn.dummyjson.com/products/images/sunglasses/Classic%20Sun%20Glasses/1.png" },
  { name: "Hermès H Belt Reversible Leather 32mm", brand: "Hermès", category: "Accessories", price: 850, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  { name: "Louis Vuitton Damier Graphite Belt 40mm", brand: "Louis Vuitton", category: "Accessories", price: 620, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  { name: "Ferragamo Gancini Reversible Leather Belt", brand: "Ferragamo", category: "Accessories", price: 450, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  { name: "Rimowa Original Cabin S Aluminum Suitcase", brand: "Rimowa", category: "Accessories", price: 1350, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
  { name: "Tumi Alpha 3 Extended Trip Expandable Packing Case", brand: "Tumi", category: "Accessories", price: 895, image: "https://cdn.dummyjson.com/products/images/mens-watches/Rolex%20Submariner%20Watch/1.png" },
];

async function addLuxuryProducts() {
  console.log('💎 Adding 100 luxury products ($1,000 - $30,000)...\n');
  
  try {
    // Count existing products
    const existingCount = await prisma.product.count();
    console.log(`📊 Current products in database: ${existingCount}\n`);

    // Insert luxury products in batches
    console.log('💾 Inserting luxury products...');
    const batchSize = 20;
    let inserted = 0;
    
    for (let i = 0; i < luxuryProducts.length; i += batchSize) {
      const batch = luxuryProducts.slice(i, i + batchSize);
      await prisma.product.createMany({
        data: batch.map(p => ({
          name: p.name,
          brand: p.brand,
          category: p.category,
          price: p.price,
          image: p.image,
          isActive: true
        }))
      });
      inserted += batch.length;
      console.log(`✅ Inserted ${inserted}/${luxuryProducts.length} luxury products`);
    }

    const newTotal = await prisma.product.count();
    console.log(`\n🎉 Successfully added ${luxuryProducts.length} luxury products!`);
    console.log(`📊 Total products now: ${newTotal} (was ${existingCount})\n`);
    
    // Show statistics
    const stats = await prisma.product.groupBy({
      by: ['category'],
      _count: true,
      _avg: { price: true },
      _max: { price: true }
    });
    
    console.log('📊 Products by category:');
    stats.sort((a, b) => b._count - a._count).forEach(s => {
      console.log(`  ${s.category}: ${s._count} products (Avg: $${Math.round(s._avg.price)}, Max: $${s._max.price.toLocaleString()})`);
    });
    
    // Show price range
    const priceStats = await prisma.product.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true }
    });
    
    console.log('\n💰 Overall price statistics:');
    console.log(`  Min: $${priceStats._min.price.toLocaleString()}`);
    console.log(`  Max: $${priceStats._max.price.toLocaleString()}`);
    console.log(`  Avg: $${Math.round(priceStats._avg.price).toLocaleString()}`);
    
    // Show most expensive products
    const topExpensive = await prisma.product.findMany({
      orderBy: { price: 'desc' },
      take: 10
    });
    
    console.log('\n👑 Top 10 most expensive products:');
    topExpensive.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} - $${p.price.toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addLuxuryProducts();
