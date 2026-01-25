import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Real Amazon products with actual images and USD prices
const products = [
    // Electronics - Smartphones
    { name: 'Apple iPhone 15 Pro Max 256GB Natural Titanium', brand: 'Apple', category: 'Electronics', price: 1199.00, image: 'https://m.media-amazon.com/images/I/81SigpJN1KL._AC_SL1500_.jpg' },
    { name: 'Samsung Galaxy S24 Ultra 256GB Titanium Black', brand: 'Samsung', category: 'Electronics', price: 1299.99, image: 'https://m.media-amazon.com/images/I/71lSiB0tQLL._AC_SL1500_.jpg' },
    { name: 'Google Pixel 8 Pro 128GB Obsidian', brand: 'Google', category: 'Electronics', price: 999.00, image: 'https://m.media-amazon.com/images/I/71f3hXNgTXL._AC_SL1500_.jpg' },
    { name: 'OnePlus 12 256GB Silky Black', brand: 'OnePlus', category: 'Electronics', price: 799.99, image: 'https://m.media-amazon.com/images/I/71K96cE4URL._AC_SL1500_.jpg' },

    // Laptops
    { name: 'Apple MacBook Pro 14 inch M3 Pro 512GB Space Black', brand: 'Apple', category: 'Laptop', price: 1999.00, image: 'https://m.media-amazon.com/images/I/61lsexTEJtL._AC_SL1500_.jpg' },
    { name: 'Dell XPS 15 Intel Core i7 32GB 1TB SSD', brand: 'Dell', category: 'Laptop', price: 1849.99, image: 'https://m.media-amazon.com/images/I/91MXLpouhoL._AC_SL1500_.jpg' },
    { name: 'ASUS ROG Zephyrus G14 RTX 4060 Gaming Laptop', brand: 'ASUS', category: 'Laptop', price: 1599.99, image: 'https://m.media-amazon.com/images/I/81GrCeuCzxL._AC_SL1500_.jpg' },
    { name: 'Lenovo ThinkPad X1 Carbon Gen 11 i7 16GB', brand: 'Lenovo', category: 'Laptop', price: 1679.00, image: 'https://m.media-amazon.com/images/I/61QGMX0Qy6L._AC_SL1500_.jpg' },

    // Tablets
    { name: 'Apple iPad Pro 12.9 inch M2 256GB WiFi Space Gray', brand: 'Apple', category: 'Tablet', price: 1099.00, image: 'https://m.media-amazon.com/images/I/81gC7frRJyL._AC_SL1500_.jpg' },
    { name: 'Samsung Galaxy Tab S9 Ultra 256GB Graphite', brand: 'Samsung', category: 'Tablet', price: 1199.99, image: 'https://m.media-amazon.com/images/I/81Wr3rMdfsL._AC_SL1500_.jpg' },

    // Audio
    { name: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones', brand: 'Sony', category: 'Audio', price: 398.00, image: 'https://m.media-amazon.com/images/I/61vJtKbAssL._AC_SL1500_.jpg' },
    { name: 'Apple AirPods Pro 2nd Generation with MagSafe', brand: 'Apple', category: 'Audio', price: 249.00, image: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg' },
    { name: 'Bose QuietComfort Ultra Headphones Black', brand: 'Bose', category: 'Audio', price: 429.00, image: 'https://m.media-amazon.com/images/I/51QesHtV8gL._AC_SL1500_.jpg' },
    { name: 'JBL Flip 6 Portable Bluetooth Speaker', brand: 'JBL', category: 'Audio', price: 129.95, image: 'https://m.media-amazon.com/images/I/71s46FFDCVL._AC_SL1500_.jpg' },
    { name: 'Sonos Era 300 Wireless Smart Speaker White', brand: 'Sonos', category: 'Audio', price: 449.00, image: 'https://m.media-amazon.com/images/I/61O3V3GXHJL._AC_SL1500_.jpg' },

    // Watches
    { name: 'Apple Watch Ultra 2 GPS Cellular 49mm Titanium', brand: 'Apple', category: 'Watch', price: 799.00, image: 'https://m.media-amazon.com/images/I/81a1zfpceVL._AC_SL1500_.jpg' },
    { name: 'Samsung Galaxy Watch 6 Classic 47mm Silver', brand: 'Samsung', category: 'Watch', price: 429.99, image: 'https://m.media-amazon.com/images/I/71i2XhHU3pL._AC_SL1500_.jpg' },
    { name: 'Garmin Fenix 7X Pro Sapphire Solar GPS Watch', brand: 'Garmin', category: 'Watch', price: 999.99, image: 'https://m.media-amazon.com/images/I/61JqiPqL1WL._AC_SL1000_.jpg' },
    { name: 'TAG Heuer Connected Calibre E4 Smartwatch', brand: 'TAG Heuer', category: 'Watch', price: 1800.00, image: 'https://m.media-amazon.com/images/I/71qDdlqrHML._AC_SL1500_.jpg' },

    // Camera and Photo
    { name: 'Sony Alpha 7 IV Full-frame Mirrorless Camera', brand: 'Sony', category: 'Camera', price: 2498.00, image: 'https://m.media-amazon.com/images/I/81YH1OYVDEL._AC_SL1500_.jpg' },
    { name: 'Canon EOS R6 Mark II Mirrorless Camera Body', brand: 'Canon', category: 'Camera', price: 2499.00, image: 'https://m.media-amazon.com/images/I/61Ww4abGpIL._AC_SL1001_.jpg' },
    { name: 'DJI Mini 4 Pro Fly More Combo Drone', brand: 'DJI', category: 'Camera', price: 1159.00, image: 'https://m.media-amazon.com/images/I/61VVKqoMJaL._AC_SL1500_.jpg' },
    { name: 'GoPro HERO12 Black Action Camera Bundle', brand: 'GoPro', category: 'Camera', price: 449.99, image: 'https://m.media-amazon.com/images/I/61p2fYdYQ8L._AC_SL1500_.jpg' },
    { name: 'Insta360 X4 8K 360 Action Camera', brand: 'Insta360', category: 'Camera', price: 499.99, image: 'https://m.media-amazon.com/images/I/61WFHjVp73L._AC_SL1500_.jpg' },

    // Gaming
    { name: 'Sony PlayStation 5 Slim Console Disc Edition', brand: 'Sony', category: 'Gaming', price: 499.99, image: 'https://m.media-amazon.com/images/I/51mXM0whQtL._SL1500_.jpg' },
    { name: 'Microsoft Xbox Series X 1TB Console', brand: 'Microsoft', category: 'Gaming', price: 499.99, image: 'https://m.media-amazon.com/images/I/51ojzJk77qL._SL1500_.jpg' },
    { name: 'Nintendo Switch OLED Model White', brand: 'Nintendo', category: 'Gaming', price: 349.99, image: 'https://m.media-amazon.com/images/I/61n39btzHYL._SL1200_.jpg' },
    { name: 'Steam Deck OLED 1TB Handheld Console', brand: 'Valve', category: 'Gaming', price: 649.00, image: 'https://m.media-amazon.com/images/I/51BKMQy-NTL._AC_SL1191_.jpg' },
    { name: 'ASUS ROG Ally 512GB Gaming Handheld', brand: 'ASUS', category: 'Gaming', price: 599.99, image: 'https://m.media-amazon.com/images/I/71YeLJXT5zL._AC_SL1500_.jpg' },

    // Home and Kitchen
    { name: 'Dyson V15 Detect Absolute Cordless Vacuum', brand: 'Dyson', category: 'Home', price: 749.99, image: 'https://m.media-amazon.com/images/I/61cLuhfxJjL._AC_SL1500_.jpg' },
    { name: 'Nespresso Vertuo Next Coffee Machine Aeroccino', brand: 'Nespresso', category: 'Home', price: 229.00, image: 'https://m.media-amazon.com/images/I/61hTavyIC0L._AC_SL1500_.jpg' },
    { name: 'KitchenAid Artisan 5-Quart Stand Mixer Empire Red', brand: 'KitchenAid', category: 'Home', price: 449.99, image: 'https://m.media-amazon.com/images/I/71kJNMz8ObL._AC_SL1500_.jpg' },
    { name: 'Vitamix A3500 Ascent Series Smart Blender', brand: 'Vitamix', category: 'Home', price: 649.95, image: 'https://m.media-amazon.com/images/I/612qVGn3UHL._AC_SL1500_.jpg' },
    { name: 'Dyson Airwrap Complete Long Styling Tool Nickel', brand: 'Dyson', category: 'Home', price: 599.99, image: 'https://m.media-amazon.com/images/I/51TJGekFnPL._SL1500_.jpg' },
    { name: 'iRobot Roomba j9 Plus Self-Emptying Robot Vacuum', brand: 'iRobot', category: 'Home', price: 899.99, image: 'https://m.media-amazon.com/images/I/61QWnu-lkjL._AC_SL1500_.jpg' },

    // Fashion - Bags
    { name: 'Coach Signature Canvas Shoulder Bag Khaki', brand: 'Coach', category: 'Fashion', price: 328.00, image: 'https://m.media-amazon.com/images/I/718t3FsFjuL._AC_SL1500_.jpg' },
    { name: 'Michael Kors Jet Set Travel Tote Brown Logo', brand: 'Michael Kors', category: 'Fashion', price: 298.00, image: 'https://m.media-amazon.com/images/I/81r6TJ3e8OL._AC_SL1500_.jpg' },
    { name: 'Kate Spade Spencer Saffiano Leather Crossbody', brand: 'Kate Spade', category: 'Fashion', price: 279.00, image: 'https://m.media-amazon.com/images/I/61c3CQsAx1L._AC_SL1500_.jpg' },
    { name: 'Tory Burch Perry Triple Compartment Tote Black', brand: 'Tory Burch', category: 'Fashion', price: 348.00, image: 'https://m.media-amazon.com/images/I/71jYnzybYJL._AC_SL1500_.jpg' },

    // Fashion - Shoes
    { name: 'Nike Air Jordan 1 Retro High OG Chicago', brand: 'Nike', category: 'Fashion', price: 180.00, image: 'https://m.media-amazon.com/images/I/71MpGmHjJdL._AC_SL1500_.jpg' },
    { name: 'Adidas Yeezy Boost 350 V2 Onyx', brand: 'Adidas', category: 'Fashion', price: 230.00, image: 'https://m.media-amazon.com/images/I/714c2lPLVVL._AC_SL1500_.jpg' },
    { name: 'New Balance 990v6 Made in USA Grey', brand: 'New Balance', category: 'Fashion', price: 199.99, image: 'https://m.media-amazon.com/images/I/61P9PAINeML._AC_SL1500_.jpg' },
    { name: 'Converse Chuck Taylor All Star High Top Black', brand: 'Converse', category: 'Fashion', price: 65.00, image: 'https://m.media-amazon.com/images/I/81W03VTpJpL._AC_SL1500_.jpg' },

    // Beauty and Personal Care
    { name: 'Dyson Supersonic Hair Dryer Prussian Blue Gold', brand: 'Dyson', category: 'Beauty', price: 429.99, image: 'https://m.media-amazon.com/images/I/61n7WjXgLPL._SL1500_.jpg' },
    { name: 'Theragun PRO Plus Percussive Therapy Device', brand: 'Therabody', category: 'Beauty', price: 599.00, image: 'https://m.media-amazon.com/images/I/61-t2R4WQWL._SL1500_.jpg' },
    { name: 'NuFace Trinity Complete Facial Toning Kit', brand: 'NuFace', category: 'Beauty', price: 395.00, image: 'https://m.media-amazon.com/images/I/51OmU6TmpTL._SL1500_.jpg' },
    { name: 'Foreo Luna 4 Facial Cleansing Device Purple', brand: 'Foreo', category: 'Beauty', price: 279.00, image: 'https://m.media-amazon.com/images/I/51rOu7YWHXL._SL1500_.jpg' },

    // Sports and Outdoors
    { name: 'Peloton Bike Plus Indoor Exercise Bike', brand: 'Peloton', category: 'Sports', price: 2495.00, image: 'https://m.media-amazon.com/images/I/61s5ZzU-x7L._AC_SL1500_.jpg' },
    { name: 'Theragun Elite Percussive Therapy Massager', brand: 'Therabody', category: 'Sports', price: 399.00, image: 'https://m.media-amazon.com/images/I/61c4xM5upDL._SL1500_.jpg' },
    { name: 'Hydrow Wave Rowing Machine with HD Screen', brand: 'Hydrow', category: 'Sports', price: 1895.00, image: 'https://m.media-amazon.com/images/I/61lL-4F4jzL._AC_SL1500_.jpg' },
    { name: 'Yeti Tundra 65 Hard Cooler Aquifer Blue', brand: 'YETI', category: 'Sports', price: 375.00, image: 'https://m.media-amazon.com/images/I/81hMrT7FTEL._AC_SL1500_.jpg' },
    { name: 'Osprey Atmos AG 65 Backpacking Backpack', brand: 'Osprey', category: 'Sports', price: 320.00, image: 'https://m.media-amazon.com/images/I/81S5g0rDBjL._AC_SL1500_.jpg' },

    // Smart Home
    { name: 'Amazon Echo Show 10 3rd Gen Smart Display', brand: 'Amazon', category: 'Smart Home', price: 249.99, image: 'https://m.media-amazon.com/images/I/61Bj64GNKZL._AC_SL1000_.jpg' },
    { name: 'Google Nest Learning Thermostat 4th Gen', brand: 'Google', category: 'Smart Home', price: 279.99, image: 'https://m.media-amazon.com/images/I/51yfCN8nk-L._AC_SL1000_.jpg' },
    { name: 'Ring Video Doorbell Pro 2 with 3D Motion', brand: 'Ring', category: 'Smart Home', price: 249.99, image: 'https://m.media-amazon.com/images/I/51Xg3C0JSSL._SL1000_.jpg' },
    { name: 'Philips Hue White and Color Ambiance Starter Kit', brand: 'Philips', category: 'Smart Home', price: 199.99, image: 'https://m.media-amazon.com/images/I/612lKB0JcVL._AC_SL1500_.jpg' },
    { name: 'Arlo Pro 5S 2K Spotlight Camera 3-Pack', brand: 'Arlo', category: 'Smart Home', price: 549.99, image: 'https://m.media-amazon.com/images/I/51xp0HQSZ2L._SL1500_.jpg' },

    // Computer Accessories
    { name: 'Apple Studio Display 27 inch 5K Retina', brand: 'Apple', category: 'Computer', price: 1599.00, image: 'https://m.media-amazon.com/images/I/71f1AwJj0YL._AC_SL1500_.jpg' },
    { name: 'LG UltraGear 27 inch 4K 144Hz Gaming Monitor', brand: 'LG', category: 'Computer', price: 799.99, image: 'https://m.media-amazon.com/images/I/81JhGNqFkKL._AC_SL1500_.jpg' },
    { name: 'Logitech MX Master 3S Wireless Mouse', brand: 'Logitech', category: 'Computer', price: 99.99, image: 'https://m.media-amazon.com/images/I/61ni3t1ryQL._AC_SL1500_.jpg' },
    { name: 'Apple Magic Keyboard with Touch ID and Numeric', brand: 'Apple', category: 'Computer', price: 199.00, image: 'https://m.media-amazon.com/images/I/71gm8v4uPBL._AC_SL1500_.jpg' },
    { name: 'Samsung 990 Pro 2TB NVMe M2 SSD', brand: 'Samsung', category: 'Computer', price: 179.99, image: 'https://m.media-amazon.com/images/I/51GfyZKjJuL._AC_SL1500_.jpg' },

    // TV and Home Entertainment
    { name: 'LG C3 65 inch OLED evo 4K Smart TV', brand: 'LG', category: 'TV', price: 1496.99, image: 'https://m.media-amazon.com/images/I/91F9JWQK4TL._AC_SL1500_.jpg' },
    { name: 'Samsung 75 inch Neo QLED 8K Smart TV QN900C', brand: 'Samsung', category: 'TV', price: 4997.99, image: 'https://m.media-amazon.com/images/I/71RFPsPC9hL._AC_SL1500_.jpg' },
    { name: 'Sony 65 inch Bravia XR A95L QD-OLED 4K Google TV', brand: 'Sony', category: 'TV', price: 2798.00, image: 'https://m.media-amazon.com/images/I/91Vb7Nfs5lL._AC_SL1500_.jpg' },
    { name: 'Sonos Arc Premium Smart Soundbar Black', brand: 'Sonos', category: 'TV', price: 899.00, image: 'https://m.media-amazon.com/images/I/71tyxZ5FVOL._AC_SL1500_.jpg' },
    { name: 'Bose Smart Soundbar 900 with Dolby Atmos', brand: 'Bose', category: 'TV', price: 899.00, image: 'https://m.media-amazon.com/images/I/71-9yFHdE8L._AC_SL1500_.jpg' },

    // Luxury Items
    { name: 'Montblanc Meisterstuck Platinum Fountain Pen', brand: 'Montblanc', category: 'Luxury', price: 630.00, image: 'https://m.media-amazon.com/images/I/61WtplUq4kL._AC_SL1500_.jpg' },
    { name: 'Ray-Ban Aviator Classic Gold Green G-15', brand: 'Ray-Ban', category: 'Luxury', price: 163.00, image: 'https://m.media-amazon.com/images/I/51g6OLCVPvL._AC_SL1500_.jpg' },
    { name: 'Oakley Sutro Prizm Road Cycling Sunglasses', brand: 'Oakley', category: 'Luxury', price: 194.00, image: 'https://m.media-amazon.com/images/I/61hCvw00vRL._AC_SL1500_.jpg' },
    { name: 'Persol Steve McQueen Special Edition Sunglasses', brand: 'Persol', category: 'Luxury', price: 450.00, image: 'https://m.media-amazon.com/images/I/51TZzVdFN8L._AC_SL1500_.jpg' },
    { name: 'Tumi Alpha 3 Continental Expandable Carry-On', brand: 'Tumi', category: 'Luxury', price: 895.00, image: 'https://m.media-amazon.com/images/I/81Y8Z3OwvdL._AC_SL1500_.jpg' },
    { name: 'Rimowa Original Cabin Aluminum Suitcase Silver', brand: 'Rimowa', category: 'Luxury', price: 1200.00, image: 'https://m.media-amazon.com/images/I/61m0rMhePaL._AC_SL1500_.jpg' },

    // Office and Productivity
    { name: 'Herman Miller Aeron Chair Graphite Size C', brand: 'Herman Miller', category: 'Office', price: 1395.00, image: 'https://m.media-amazon.com/images/I/41uueqMbuBL._AC_SL1024_.jpg' },
    { name: 'Steelcase Leap V2 Ergonomic Office Chair', brand: 'Steelcase', category: 'Office', price: 1239.00, image: 'https://m.media-amazon.com/images/I/71Hf7tEDJVL._AC_SL1500_.jpg' },
    { name: 'Uplift V2 Standing Desk 60x30 Walnut Top', brand: 'Uplift', category: 'Office', price: 799.00, image: 'https://m.media-amazon.com/images/I/71hIYGRmMFL._AC_SL1500_.jpg' },
    { name: 'CalDigit TS4 Thunderbolt 4 Dock 18 Ports', brand: 'CalDigit', category: 'Office', price: 399.99, image: 'https://m.media-amazon.com/images/I/61O3qqBxqYL._AC_SL1500_.jpg' },

    // Musical Instruments
    { name: 'Yamaha P-125 88-Key Digital Piano Black', brand: 'Yamaha', category: 'Music', price: 699.99, image: 'https://m.media-amazon.com/images/I/71L3UlG4MAL._AC_SL1500_.jpg' },
    { name: 'Fender Player Stratocaster Electric Guitar', brand: 'Fender', category: 'Music', price: 849.99, image: 'https://m.media-amazon.com/images/I/61vHiZrSEaL._AC_SL1200_.jpg' },
    { name: 'Audio-Technica AT2020 Cardioid Condenser Mic', brand: 'Audio-Technica', category: 'Music', price: 99.00, image: 'https://m.media-amazon.com/images/I/71SZ9AVCDBL._AC_SL1500_.jpg' },
    { name: 'Shure SM7B Dynamic Vocal Microphone', brand: 'Shure', category: 'Music', price: 399.00, image: 'https://m.media-amazon.com/images/I/81Y5pB-vkgL._AC_SL1500_.jpg' },
    { name: 'Roland TD-17KVX V-Drums Electronic Drum Kit', brand: 'Roland', category: 'Music', price: 2299.99, image: 'https://m.media-amazon.com/images/I/71n0YXnHt8L._AC_SL1500_.jpg' },

    // Baby and Kids
    { name: 'UPPAbaby Vista V2 Stroller Greyson', brand: 'UPPAbaby', category: 'Baby', price: 1099.99, image: 'https://m.media-amazon.com/images/I/71pPOL-O2dL._AC_SL1500_.jpg' },
    { name: 'Bugaboo Fox 5 Complete Stroller Black', brand: 'Bugaboo', category: 'Baby', price: 1499.00, image: 'https://m.media-amazon.com/images/I/61MU1dpCBYL._AC_SL1500_.jpg' },
    { name: 'LEGO Star Wars Millennium Falcon 75375', brand: 'LEGO', category: 'Baby', price: 84.99, image: 'https://m.media-amazon.com/images/I/81K91uuuFtL._AC_SL1500_.jpg' },
    { name: 'Nintendo Switch Lite Turquoise', brand: 'Nintendo', category: 'Baby', price: 199.00, image: 'https://m.media-amazon.com/images/I/61fSLBf8VnL._SL1500_.jpg' },

    // Pet Supplies
    { name: 'Furbo 360 Dog Camera Treat Tossing Full HD', brand: 'Furbo', category: 'Pet', price: 210.00, image: 'https://m.media-amazon.com/images/I/51eTiUoA7oL._AC_SL1500_.jpg' },
    { name: 'PetSafe ScoopFree Self-Cleaning Litter Box', brand: 'PetSafe', category: 'Pet', price: 169.95, image: 'https://m.media-amazon.com/images/I/71MckjhmtSL._AC_SL1500_.jpg' },
    { name: 'PETKIT PURA X Self-Cleaning Cat Litter Box', brand: 'PETKIT', category: 'Pet', price: 549.00, image: 'https://m.media-amazon.com/images/I/51KBXQ5CPXL._AC_SL1500_.jpg' },

    // Health and Wellness
    { name: 'Oura Ring Gen 3 Heritage Silver Size 10', brand: 'Oura', category: 'Health', price: 299.00, image: 'https://m.media-amazon.com/images/I/51etWL5C0gL._AC_SL1500_.jpg' },
    { name: 'Withings Body Plus Smart Wi-Fi Scale Black', brand: 'Withings', category: 'Health', price: 99.95, image: 'https://m.media-amazon.com/images/I/71xZ3VtbloL._AC_SL1500_.jpg' },
    { name: 'Theragun Mini 2.0 Portable Massager', brand: 'Therabody', category: 'Health', price: 199.00, image: 'https://m.media-amazon.com/images/I/614zwEdDvmL._SL1500_.jpg' },
    { name: 'Whoop 4.0 Health Fitness Tracker Onyx', brand: 'Whoop', category: 'Health', price: 239.00, image: 'https://m.media-amazon.com/images/I/41TbBJdHKnL._AC_SL1200_.jpg' },

    // Automotive
    { name: 'Thinkware U1000 4K Dash Cam Front and Rear', brand: 'Thinkware', category: 'Auto', price: 499.99, image: 'https://m.media-amazon.com/images/I/61mRAPfH2gL._AC_SL1500_.jpg' },
    { name: 'Blackvue DR900X-2CH Plus 4K Dash Camera', brand: 'Blackvue', category: 'Auto', price: 519.99, image: 'https://m.media-amazon.com/images/I/61fLfI7hVNL._AC_SL1500_.jpg' },
    { name: 'NOCO Boost X GBX155 4250A Jump Starter', brand: 'NOCO', category: 'Auto', price: 349.95, image: 'https://m.media-amazon.com/images/I/71y3DfFUgpL._AC_SL1500_.jpg' },
];

async function main() {
    console.log('Starting product seed with real Amazon products...');

    // Delete existing products
    await prisma.product.deleteMany({});
    console.log('Deleted existing products.');

    // Insert new products
    for (const product of products) {
        await prisma.product.create({
            data: {
                ...product,
                isActive: true,
                productUrl: ''
            }
        });
    }

    console.log('Successfully seeded ' + products.length + ' real Amazon products!');
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
