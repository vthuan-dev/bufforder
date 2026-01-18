import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
    { name: 'iPhone 16 Pro Max 256GB', brand: 'Apple', category: 'Điện thoại', price: 1199.00, image: '' },
    { name: 'iPhone 16 Pro 128GB', brand: 'Apple', category: 'Điện thoại', price: 999.00, image: '' },
    { name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', category: 'Điện thoại', price: 1299.00, image: '' },
    { name: 'MacBook Pro 14 M3 Pro', brand: 'Apple', category: 'Laptop', price: 1999.00, image: '' },
    { name: 'iPad Pro 13 M4 256GB', brand: 'Apple', category: 'Máy tính bảng', price: 1299.00, image: '' },
    { name: 'Sony WH-1000XM5 ANC', brand: 'Sony', category: 'Âm thanh', price: 399.00, image: '' },
    { name: 'Rolex Submariner 126610LN', brand: 'Rolex', category: 'Đồng hồ', price: 14500.00, image: '' }
];

const brands = ["Nike", "Adidas", "Samsung", "Apple", "Sony", "LG", "Xiaomi", "Oppo", "Dell", "HP", "Rolex", "Gucci"];
const categories = ["Điện thoại", "Laptop", "Máy tính bảng", "Âm thanh", "Thời trang", "Đồng hồ"];

async function main() {
    console.log('Bắt đầu seed dữ liệu sản phẩm (Giá USD, Ảnh trống)...');

    await prisma.product.deleteMany({});
    console.log('Đã xóa sản phẩm cũ.');

    // Thêm các sản phẩm chính
    for (const product of products) {
        await prisma.product.create({
            data: {
                ...product,
                isActive: true
            }
        });
    }

    // Tự động tạo thêm cho đủ 100 sản phẩm
    let count = products.length;
    while (count < 100) {
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];

        await prisma.product.create({
            data: {
                name: `${brand} Premium Item #${count + 1}`,
                brand: brand,
                category: category,
                price: Math.floor(Math.random() * 2000) + 50,
                image: '', // Để trống cho người dùng tự thêm
                isActive: true
            }
        });
        count++;
    }

    console.log(`Đã seed thành công 100 sản phẩm với giá USD và ảnh trống.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
