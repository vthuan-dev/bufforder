#!/bin/bash

echo "🌱 Importing Amazon products in batches..."
echo ""

cd /var/www/greeting-message/backend/prisma/split

# Import each part
echo "📦 Importing part 1/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part1.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 1 imported successfully"
else
    echo "❌ Error importing part 1"
    exit 1
fi
echo ""

echo "📦 Importing part 2/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part2.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 2 imported successfully"
else
    echo "❌ Error importing part 2"
    exit 1
fi
echo ""

echo "📦 Importing part 3/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part3.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 3 imported successfully"
else
    echo "❌ Error importing part 3"
    exit 1
fi
echo ""

echo "📦 Importing part 4/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part4.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 4 imported successfully"
else
    echo "❌ Error importing part 4"
    exit 1
fi
echo ""

echo "📦 Importing part 5/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part5.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 5 imported successfully"
else
    echo "❌ Error importing part 5"
    exit 1
fi
echo ""

echo "📦 Importing part 6/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part6.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 6 imported successfully"
else
    echo "❌ Error importing part 6"
    exit 1
fi
echo ""

echo "📦 Importing part 7/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part7.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 7 imported successfully"
else
    echo "❌ Error importing part 7"
    exit 1
fi
echo ""

echo "📦 Importing part 8/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part8.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 8 imported successfully"
else
    echo "❌ Error importing part 8"
    exit 1
fi
echo ""

echo "📦 Importing part 9/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part9.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 9 imported successfully"
else
    echo "❌ Error importing part 9"
    exit 1
fi
echo ""

echo "📦 Importing part 10/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part10.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 10 imported successfully"
else
    echo "❌ Error importing part 10"
    exit 1
fi
echo ""

echo "📦 Importing part 11/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part11.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 11 imported successfully"
else
    echo "❌ Error importing part 11"
    exit 1
fi
echo ""

echo "📦 Importing part 12/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part12.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 12 imported successfully"
else
    echo "❌ Error importing part 12"
    exit 1
fi
echo ""

echo "📦 Importing part 13/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part13.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 13 imported successfully"
else
    echo "❌ Error importing part 13"
    exit 1
fi
echo ""

echo "📦 Importing part 14/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part14.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 14 imported successfully"
else
    echo "❌ Error importing part 14"
    exit 1
fi
echo ""

echo "📦 Importing part 15/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part15.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 15 imported successfully"
else
    echo "❌ Error importing part 15"
    exit 1
fi
echo ""

echo "📦 Importing part 16/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part16.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 16 imported successfully"
else
    echo "❌ Error importing part 16"
    exit 1
fi
echo ""

echo "📦 Importing part 17/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part17.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 17 imported successfully"
else
    echo "❌ Error importing part 17"
    exit 1
fi
echo ""

echo "📦 Importing part 18/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part18.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 18 imported successfully"
else
    echo "❌ Error importing part 18"
    exit 1
fi
echo ""

echo "📦 Importing part 19/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part19.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 19 imported successfully"
else
    echo "❌ Error importing part 19"
    exit 1
fi
echo ""

echo "📦 Importing part 20/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part20.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 20 imported successfully"
else
    echo "❌ Error importing part 20"
    exit 1
fi
echo ""

echo "📦 Importing part 21/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part21.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 21 imported successfully"
else
    echo "❌ Error importing part 21"
    exit 1
fi
echo ""

echo "📦 Importing part 22/22..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message < amazon_products_part22.sql
if [ $? -eq 0 ]; then
    echo "✅ Part 22 imported successfully"
else
    echo "❌ Error importing part 22"
    exit 1
fi
echo ""

echo "🎉 All parts imported successfully!"
echo ""
echo "📊 Checking total products..."
mysql -u greeting_user -p'Greeting@2024!Strong' greeting_message -e "SELECT COUNT(*) as total_products FROM product;"
