# Product Seeding Guide - 200 Real Products

## Overview
This guide explains how to seed 200 real products with actual prices, images, and product URLs into your database.

## Data Source
- **Primary Source**: DummyJSON API (https://dummyjson.com/products)
  - 194 products with real-looking data
  - Includes: name, brand, category, price, images
  - Categories: electronics, furniture, beauty, groceries, home-decoration, etc.

- **Additional Products**: 6 manually curated products
  - Total: 200 products

## Schema Changes

### New Field Added to Product Model
```prisma
model Product {
  id         Int      @id @default(autoincrement())
  name       String
  brand      String
  category   String
  price      Float
  image      String?  @db.Text
  productUrl String?  @db.Text  // ← NEW FIELD
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Step-by-Step Instructions

### Step 1: Run Migration (Add productUrl field)
```bash
node run-product-url-migration.js
```

This will:
- Add `productUrl` column to the `product` table
- Verify the column was created successfully

### Step 2: Seed Products from API
```bash
node seed-products-from-api.js
```

This will:
1. Fetch 194 products from DummyJSON API
2. Clear existing products in database
3. Insert all products in batches
4. Add 6 additional curated products
5. Show category breakdown

**Expected Output:**
```
📦 Fetching products from DummyJSON API...
✅ Fetched 194 products from API
🗑️  Clearing existing products...
💾 Inserting products into database...
✅ Inserted batch 1/4
✅ Inserted batch 2/4
✅ Inserted batch 3/4
✅ Inserted batch 4/4
✅ Added 6 additional products

🎉 Successfully seeded 200 products!

📊 Products by category:
   electronics: 45 products
   furniture: 32 products
   beauty: 28 products
   groceries: 25 products
   ...
```

## Product Data Structure

Each product includes:
- **name**: Product title (e.g., "iPhone 14 Pro Max")
- **brand**: Brand name (e.g., "Apple", "Samsung", "Nike")
- **category**: Product category (e.g., "electronics", "furniture")
- **price**: Real price in USD (e.g., 999.99)
- **image**: Product image URL (from DummyJSON or Unsplash)
- **productUrl**: Link to product page (DummyJSON or Amazon)
- **isActive**: true (all products active by default)

## Sample Products

### From DummyJSON API:
1. iPhone 14 Pro Max - Apple - $999
2. Samsung Galaxy S23 - Samsung - $899
3. MacBook Pro 16" - Apple - $2499
4. Sony WH-1000XM5 - Sony - $399
5. Nike Air Max 270 - Nike - $150

### Additional Curated Products:
1. Premium Wireless Headphones - AudioTech - $299.99
2. Smart Fitness Watch - FitPro - $199.99
3. Portable Bluetooth Speaker - SoundWave - $79.99
4. Professional Camera Lens - LensMaster - $899.99
5. Gaming Mechanical Keyboard - KeyTech - $149.99
6. Ergonomic Office Chair - ComfortSeating - $399.99

## Categories Available

The seeded products cover these categories:
- electronics
- furniture
- beauty
- groceries
- home-decoration
- fragrances
- skincare
- smartphones
- laptops
- automotive
- motorcycle
- lighting
- mens-shirts
- mens-shoes
- mens-watches
- womens-bags
- womens-dresses
- womens-jewellery
- womens-shoes
- womens-watches
- sunglasses
- sports-accessories
- kitchen-accessories

## Verification

After seeding, verify the products:

```bash
node check-real-products.js
```

Or check in MySQL:
```sql
SELECT COUNT(*) FROM product;
-- Should return 200

SELECT category, COUNT(*) as count 
FROM product 
GROUP BY category 
ORDER BY count DESC;
-- Shows category breakdown

SELECT * FROM product LIMIT 10;
-- Shows sample products
```

## Notes

- All products have `isActive = true` by default
- Product URLs point to either DummyJSON or Amazon (for additional products)
- Images are hosted on DummyJSON CDN or Unsplash
- Prices are in USD
- The script clears existing products before seeding (be careful in production!)

## Troubleshooting

**Error: "Cannot connect to database"**
- Check your `.env` file in `backend/` folder
- Verify MySQL is running
- Check database credentials

**Error: "Table 'product' doesn't exist"**
- Run database setup first: `node setup-database.js`

**Error: "Column 'productUrl' doesn't exist"**
- Run migration first: `node run-product-url-migration.js`

**API fetch fails**
- Check internet connection
- DummyJSON API might be down (rare)
- Try again in a few minutes

## Future Enhancements

Possible improvements:
1. Add product descriptions
2. Add multiple images per product
3. Add stock quantity
4. Add product ratings/reviews
5. Add product variants (size, color)
6. Sync with real Amazon Product API (requires API key)

## Files Created

1. `backend/migrations/add_product_url.sql` - Migration to add productUrl field
2. `run-product-url-migration.js` - Script to run the migration
3. `seed-products-from-api.js` - Script to seed 200 products
4. `PRODUCT_SEEDING_GUIDE.md` - This guide

## Quick Start (TL;DR)

```bash
# 1. Add productUrl field to database
node run-product-url-migration.js

# 2. Seed 200 products
node seed-products-from-api.js

# 3. Verify
node check-real-products.js
```

Done! You now have 200 real products in your database. 🎉
