const fs = require('fs');
const path = require('path');

console.log('🔍 TÌM SẢN PHẨM TỪ $10,000 TRỞ LÊN\n');

// Đọc file SQL đầy đủ
const sqlFile = path.join(__dirname, 'backend/prisma/amazon_products_full.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

// Tách các dòng INSERT
const insertLines = sqlContent.split('\n').filter(line => line.trim().startsWith('('));

const products = [];

insertLines.forEach(line => {
  // Parse dòng INSERT để lấy thông tin sản phẩm
  const match = line.match(/\('([^']+)',\s*'([^']+)',\s*'([^']*)',\s*(\d+\.?\d*),\s*'([^']*)',\s*'([^']*)'/);
  
  if (match) {
    const [, name, category, subcategory, price, imageUrl, productUrl] = match;
    const priceNum = parseFloat(price);
    
    // Chỉ lấy sản phẩm từ $10,000 trở lên
    if (priceNum >= 10000) {
      products.push({
        name,
        category,
        subcategory,
        price: priceNum,
        imageUrl,
        productUrl
      });
    }
  }
});

// Sắp xếp theo giá
products.sort((a, b) => a.price - b.price);

console.log(`✅ Tìm thấy ${products.length} sản phẩm từ $10,000 trở lên\n`);

if (products.length > 0) {
  console.log('📊 PHÂN BỐ GIÁ:');
  console.log(`   Giá thấp nhất: $${products[0].price.toLocaleString()}`);
  console.log(`   Giá cao nhất: $${products[products.length - 1].price.toLocaleString()}`);
  
  const avg = products.reduce((sum, p) => sum + p.price, 0) / products.length;
  console.log(`   Giá trung bình: $${avg.toLocaleString()}\n`);
  
  // Phân loại theo khoảng giá
  const ranges = {
    '10k-30k': products.filter(p => p.price >= 10000 && p.price < 30000),
    '30k-50k': products.filter(p => p.price >= 30000 && p.price < 50000),
    '50k-100k': products.filter(p => p.price >= 50000 && p.price < 100000),
    '100k+': products.filter(p => p.price >= 100000)
  };
  
  console.log('📈 PHÂN BỐ THEO KHOẢNG GIÁ:');
  Object.entries(ranges).forEach(([range, items]) => {
    console.log(`   $${range}: ${items.length} sản phẩm`);
  });
  
  console.log('\n🔍 MẪU SẢN PHẨM $10K-$30K (10 sản phẩm đầu):');
  console.log('='.repeat(100));
  
  ranges['10k-30k'].slice(0, 10).forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.name}`);
    console.log(`   Giá: $${p.price.toLocaleString()}`);
    console.log(`   Danh mục: ${p.category} > ${p.subcategory}`);
    console.log(`   Ảnh: ${p.imageUrl.substring(0, 80)}...`);
    console.log(`   URL: ${p.productUrl.substring(0, 80)}...`);
  });
  
  // Kiểm tra ảnh có phải placeholder không
  console.log('\n\n🖼️  KIỂM TRA CHẤT LƯỢNG ẢNH:');
  console.log('='.repeat(100));
  
  const withRealImages = products.filter(p => 
    p.imageUrl && 
    p.imageUrl.includes('amazon') && 
    !p.imageUrl.includes('placeholder') &&
    p.imageUrl.length > 50
  );
  
  const withProductUrl = products.filter(p => p.productUrl && p.productUrl.includes('amazon'));
  
  console.log(`✅ Có ảnh Amazon thật: ${withRealImages.length}/${products.length} sản phẩm`);
  console.log(`✅ Có URL sản phẩm: ${withProductUrl.length}/${products.length} sản phẩm`);
  
  // Lưu danh sách sản phẩm $10k-$30k ra file
  const output = {
    total: ranges['10k-30k'].length,
    products: ranges['10k-30k'].map(p => ({
      name: p.name,
      price: p.price,
      category: p.category,
      subcategory: p.subcategory,
      imageUrl: p.imageUrl,
      productUrl: p.productUrl
    }))
  };
  
  fs.writeFileSync('products-10k-30k.json', JSON.stringify(output, null, 2));
  console.log(`\n💾 Đã lưu danh sách vào file: products-10k-30k.json`);
  
} else {
  console.log('❌ Không tìm thấy sản phẩm nào từ $10,000 trở lên');
}

console.log('\n✅ HOÀN TẤT PHÂN TÍCH\n');
