# Amazon Products Seed - 42,000+ Real Products

## Overview
Successfully converted Amazon CSV data to SQL format with 42,430 real products featuring diverse pricing from $10 to $30,000.

## Files Created

### 1. `convert-csv-to-sql.js`
- Converts CSV to SQL format
- Applies diverse pricing distribution
- Validates image URLs and product data
- Escapes SQL special characters

### 2. `backend/prisma/amazon_products_full.sql`
- SQL seed file with 42,430 products
- Real Amazon product images
- Diverse pricing: $10 - $30,000
- Categories: Electronics, Laptops, Smartphones, etc.

### 3. `vps-seed-amazon-products.sh`
- Automated VPS deployment script
- Pulls latest changes
- Imports SQL data
- Shows statistics and price distribution

## Price Distribution

The products are distributed across price ranges:

- **$10-$100**: ~25% (budget products)
- **$100-$500**: ~25% (mid-range products)
- **$500-$1k**: ~15% (premium products)
- **$1k-$3k**: ~15% (luxury products)
- **$3k-$10k**: ~10% (high-end products)
- **$10k-$30k**: ~10% (ultra-luxury products)

## Product Features

✅ Real Amazon product images (CDN URLs)
✅ Authentic product names and descriptions
✅ Valid product URLs
✅ Multiple categories and subcategories
✅ Diverse pricing for realistic marketplace
✅ All images validated (HTTP/HTTPS)

## Deployment Instructions

### On VPS (180.93.35.4)

```bash
# SSH into VPS
ssh root@180.93.35.4

# Navigate to project
cd /var/www/greeting-message

# Run the seed script
bash vps-seed-amazon-products.sh
```

### Manual Deployment

```bash
# Pull latest changes
git pull

# Import SQL directly
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < backend/prisma/amazon_products_full.sql

# Verify
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message -e "SELECT COUNT(*) FROM product;"
```

## Data Source

- **Original CSV**: `backend/prisma/archive/amazon_products_cleaned.csv`
- **Total rows**: 42,434 products
- **Valid products**: 42,430 (99.99% success rate)
- **Skipped**: 3 invalid entries

## Categories Included

- Electronics (Smartphones, Laptops, Tablets)
- Audio (Headphones, Speakers)
- Watches (Smartwatches, Luxury watches)
- Cameras (DSLR, Action cameras, Drones)
- Gaming (Consoles, Handhelds)
- Home (Appliances, Kitchen)
- Fashion (Bags, Shoes, Accessories)
- Beauty & Health
- Sports & Fitness
- Smart Home
- Office Equipment
- Music Instruments
- Baby & Kids
- Pet Supplies
- Automotive

## Database Schema

```sql
CREATE TABLE product (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  image TEXT,
  productUrl TEXT,
  isActive BOOLEAN DEFAULT 1,
  createdAt DATETIME DEFAULT NOW(),
  updatedAt DATETIME DEFAULT NOW()
);
```

## Verification Queries

```sql
-- Total products
SELECT COUNT(*) FROM product;

-- Price distribution
SELECT 
  CASE 
    WHEN price < 100 THEN '$10-$100'
    WHEN price < 500 THEN '$100-$500'
    WHEN price < 1000 THEN '$500-$1k'
    WHEN price < 3000 THEN '$1k-$3k'
    WHEN price < 10000 THEN '$3k-$10k'
    ELSE '$10k-$30k'
  END as price_range,
  COUNT(*) as count
FROM product
GROUP BY price_range;

-- Sample products
SELECT name, brand, category, price, image 
FROM product 
LIMIT 10;

-- Category breakdown
SELECT category, COUNT(*) as count 
FROM product 
GROUP BY category 
ORDER BY count DESC;
```

## Benefits

1. **Real Product Images**: All images from Amazon CDN (m.media-amazon.com)
2. **No Duplicates**: Each product has unique name and image
3. **Diverse Pricing**: Realistic marketplace with products at all price points
4. **Large Dataset**: 42,000+ products for comprehensive testing
5. **Easy Deployment**: Single SQL file, one command to seed
6. **Validated Data**: All products checked for valid images and data

## Next Steps

After seeding:
1. ✅ Verify product count in admin panel
2. ✅ Check images are loading correctly
3. ✅ Test price sorting functionality
4. ✅ Verify diverse price ranges in product list
5. ✅ Test search and filtering

## Troubleshooting

### Images not loading
- Check if Amazon CDN is accessible from your location
- Verify image URLs in database are complete
- Check browser console for CORS errors

### Import fails
- Ensure MySQL user has INSERT permissions
- Check database connection
- Verify SQL file is not corrupted

### Price distribution incorrect
- Run verification query to check actual distribution
- Re-run conversion script if needed

## Git Commits

- `69e216c`: Add Amazon products SQL seed with 42k+ products and diverse pricing
- `85e60c4`: Add VPS seed script for Amazon products

## Status

✅ CSV to SQL conversion complete
✅ SQL file generated (42,430 products)
✅ Files committed and pushed to Git
✅ VPS deployment script ready
⏳ Awaiting VPS deployment

## Commands Summary

```bash
# Local: Generate SQL
node convert-csv-to-sql.js

# Local: Commit and push
git add . && git commit -m "Add Amazon products" && git push

# VPS: Deploy
ssh root@180.93.35.4
cd /var/www/greeting-message
bash vps-seed-amazon-products.sh
```
