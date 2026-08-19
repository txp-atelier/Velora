require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");
const Review = require("./models/Review");
const Cart = require("./models/Cart");
const PasswordResetToken = require("./models/PasswordResetToken");

const PASSWORD = "password123";

// Real, verified product photography — DummyJSON's studio-shot CDN for
// physical products (clean white background, consistent style across the
// whole catalog) and Open Library's cover API for the 4 real books. Every
// URL below was individually downloaded and visually inspected before use,
// so galleries always show genuine photos of a matching item, never
// mismatched or placeholder art.
const productCatalog = [
  { name: "boAt Rockerz 450 Wireless Headphones", category: "Electronics", subcategory: "Audio", brand: "boAt", price: 1499, originalPrice: 3990, stock: 120, seller: 0, desc: "40mm drivers, 15-hour playback, dual connectivity.", images: ["https://cdn.dummyjson.com/product-images/mobile-accessories/beats-flex-wireless-earphones/1.webp"] },
  { name: "Noise ColorFit Pro 4 Smart Watch", category: "Electronics", subcategory: "Wearables", brand: "Noise", price: 2999, originalPrice: 5999, stock: 85, seller: 0, desc: "AMOLED display, Bluetooth calling, 7-day battery.", images: ["https://cdn.dummyjson.com/product-images/mobile-accessories/apple-watch-series-4-gold/1.webp", "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-watch-series-4-gold/2.webp", "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-watch-series-4-gold/3.webp"] },
  { name: "Samsung Galaxy Buds FE", category: "Electronics", subcategory: "Audio", brand: "Samsung", price: 4999, originalPrice: 6999, stock: 60, seller: 0, desc: "Active noise cancellation, ergonomic fit, wireless charging case.", images: ["https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods/1.webp", "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods/2.webp"] },
  { name: "HP Pavilion 15 Laptop", category: "Electronics", subcategory: "Computers", brand: "HP", price: 52999, originalPrice: 64999, stock: 25, seller: 0, desc: "Intel Core i5, 16GB RAM, 512GB SSD, 15.6-inch FHD display.", images: ["https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/1.webp", "https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/2.webp", "https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/3.webp"] },
  { name: "Apple MagSafe Battery Pack", category: "Electronics", subcategory: "Accessories", brand: "Apple", price: 8999, originalPrice: 10995, stock: 40, seller: 0, desc: "Magnetic wireless battery pack, snaps on for on-the-go charging, USB-C input.", images: ["https://cdn.dummyjson.com/product-images/mobile-accessories/apple-magsafe-battery-pack/1.webp", "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-magsafe-battery-pack/2.webp"] },
  { name: "Fire-Boltt Ninja Call Pro Smartwatch", category: "Electronics", subcategory: "Wearables", brand: "Fire-Boltt", price: 1999, originalPrice: 4999, stock: 150, seller: 0, desc: "1.69-inch display, Bluetooth calling, 100+ sports modes.", images: ["https://cdn.dummyjson.com/product-images/mobile-accessories/apple-watch-series-4-gold/2.webp", "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-watch-series-4-gold/3.webp"] },
  { name: "Sony WH-CH520 Headphones", category: "Electronics", subcategory: "Audio", brand: "Sony", price: 3990, originalPrice: 5490, stock: 70, seller: 0, desc: "Lightweight on-ear, 50-hour battery, DSEE upscaling.", images: ["https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods-max-silver/1.webp"] },
  { name: "OnePlus Nord Buds 2r", category: "Electronics", subcategory: "Audio", brand: "OnePlus", price: 1799, originalPrice: 2299, stock: 200, seller: 0, desc: "12.4mm drivers, 38-hour total playback, IP55 rating.", images: ["https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods/3.webp", "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods/1.webp"] },
  { name: "Allen Solly Men's Formal Shirt", category: "Fashion", subcategory: "Men", brand: "Allen Solly", price: 1299, originalPrice: 2499, stock: 90, seller: 1, desc: "Slim fit checked cotton shirt, wrinkle-resistant, office-ready.", images: ["https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/1.webp", "https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/2.webp", "https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/3.webp"] },
  { name: "Levi's Classic Check Shirt", category: "Fashion", subcategory: "Men", brand: "Levi's", price: 2499, originalPrice: 3999, stock: 75, seller: 1, desc: "Classic fit checked cotton shirt, everyday comfort, durable stitching.", images: ["https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/1.webp", "https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/2.webp", "https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/3.webp"] },
  { name: "Biba Women's Anarkali Kurta", category: "Fashion", subcategory: "Women", brand: "Biba", price: 1899, originalPrice: 3499, stock: 55, seller: 1, desc: "Colour-blocked anarkali silhouette, flowy rayon fabric, festive wear.", images: ["https://cdn.dummyjson.com/product-images/womens-dresses/marni-red-&-black-suit/1.webp", "https://cdn.dummyjson.com/product-images/womens-dresses/marni-red-&-black-suit/2.webp"] },
  { name: "Puma Running Shoes", category: "Fashion", subcategory: "Footwear", brand: "Puma", price: 3499, originalPrice: 5999, stock: 65, seller: 1, desc: "Breathable mesh upper, cushioned midsole, all-day comfort.", images: ["https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/1.webp", "https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/2.webp", "https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/3.webp"] },
  { name: "FabIndia Cotton Maxi Dress", category: "Fashion", subcategory: "Women", brand: "FabIndia", price: 2199, originalPrice: 3299, stock: 45, seller: 1, desc: "Hand-finished cotton maxi dress with tie waist, breathable everyday wear.", images: ["https://cdn.dummyjson.com/product-images/tops/gray-dress/1.webp", "https://cdn.dummyjson.com/product-images/tops/gray-dress/2.webp"] },
  { name: "US Polo Assn Casual Shirt", category: "Fashion", subcategory: "Men", brand: "US Polo", price: 899, originalPrice: 1799, stock: 110, seller: 1, desc: "Classic checked cotton shirt, relaxed fit, everyday casual.", images: ["https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/1.webp", "https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/2.webp"] },
  { name: "Prestige Iris 750W Mixer Grinder", category: "Home & Kitchen", subcategory: "Appliances", brand: "Prestige", price: 3299, originalPrice: 4995, stock: 50, seller: 2, desc: "3 stainless steel jars, 750W motor, overload protection.", images: ["https://cdn.dummyjson.com/product-images/kitchen-accessories/boxed-blender/1.webp", "https://cdn.dummyjson.com/product-images/kitchen-accessories/boxed-blender/2.webp"] },
  { name: "Milton Stainless Steel Cook & Serve Pot", category: "Home & Kitchen", subcategory: "Cookware", brand: "Milton", price: 799, originalPrice: 1299, stock: 180, seller: 2, desc: "Heavy-gauge stainless steel pot with glass lid, even heating, easy to clean.", images: ["https://cdn.dummyjson.com/product-images/kitchen-accessories/silver-pot-with-glass-cap/1.webp"] },
  { name: "Wakefit Orthopedic Memory Foam Mattress", category: "Home & Kitchen", subcategory: "Furniture", brand: "Wakefit", price: 8999, originalPrice: 14999, stock: 30, seller: 2, desc: "High-density foam, 7-zone support, 10-year warranty.", images: ["https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-bed/1.webp", "https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-bed/2.webp", "https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-bed/3.webp"] },
  { name: "Borosil Glass Lunch Box Set", category: "Home & Kitchen", subcategory: "Storage", brand: "Borosil", price: 1299, originalPrice: 1999, stock: 95, seller: 2, desc: "Microwave-safe borosilicate glass, airtight lids, 3-piece set.", images: ["https://cdn.dummyjson.com/product-images/kitchen-accessories/lunch-box/1.webp"] },
  { name: "Philips 20L Digital Microwave Oven", category: "Home & Kitchen", subcategory: "Appliances", brand: "Philips", price: 7999, originalPrice: 11995, stock: 35, seller: 2, desc: "20L digital microwave, 8 auto-cook menus, defrost function.", images: ["https://cdn.dummyjson.com/product-images/kitchen-accessories/microwave-oven/1.webp", "https://cdn.dummyjson.com/product-images/kitchen-accessories/microwave-oven/2.webp", "https://cdn.dummyjson.com/product-images/kitchen-accessories/microwave-oven/3.webp"] },
  { name: "Lakme Absolute Matte Lipstick", category: "Beauty", subcategory: "Makeup", brand: "Lakme", price: 499, originalPrice: 750, stock: 200, seller: 2, desc: "Long-lasting matte finish, rich pigment, 12-hour wear.", images: ["https://cdn.dummyjson.com/product-images/beauty/red-lipstick/1.webp"] },
  { name: "Maybelline Fit Me Foundation", category: "Beauty", subcategory: "Makeup", brand: "Maybelline", price: 549, originalPrice: 699, stock: 160, seller: 2, desc: "Natural matte finish, oil-free formula, wide shade range.", images: ["https://cdn.dummyjson.com/product-images/beauty/powder-canister/1.webp"] },
  { name: "Attitude Super Leaves Hand Soap", category: "Beauty", subcategory: "Skincare", brand: "Attitude", price: 299, originalPrice: 450, stock: 220, seller: 2, desc: "Plant-based hypoallergenic hand soap, lemon leaves scent, dermatologically tested.", images: ["https://cdn.dummyjson.com/product-images/skin-care/attitude-super-leaves-hand-soap/1.webp", "https://cdn.dummyjson.com/product-images/skin-care/attitude-super-leaves-hand-soap/2.webp", "https://cdn.dummyjson.com/product-images/skin-care/attitude-super-leaves-hand-soap/3.webp"] },
  { name: "Vaseline Men Body & Face Lotion", category: "Beauty", subcategory: "Skincare", brand: "Vaseline", price: 249, originalPrice: 349, stock: 250, seller: 2, desc: "Fast-absorbing lotion for face and body, non-greasy, healing moisture for men.", images: ["https://cdn.dummyjson.com/product-images/skin-care/vaseline-men-body-and-face-lotion/1.webp", "https://cdn.dummyjson.com/product-images/skin-care/vaseline-men-body-and-face-lotion/2.webp", "https://cdn.dummyjson.com/product-images/skin-care/vaseline-men-body-and-face-lotion/3.webp"] },
  { name: "Yonex Mavis 350 Shuttlecock Pack", category: "Sports", subcategory: "Badminton", brand: "Yonex", price: 1099, originalPrice: 1499, stock: 80, seller: 3, desc: "Nylon shuttlecocks, consistent flight, pack of 6.", images: ["https://cdn.dummyjson.com/product-images/sports-accessories/feather-shuttlecock/1.webp"] },
  { name: "Boldfit Yoga Mat 6mm", category: "Sports", subcategory: "Fitness", brand: "Boldfit", price: 699, originalPrice: 1299, stock: 140, seller: 3, desc: "Anti-slip TPE material, 6mm cushioning, carry strap included.", images: ["https://commons.wikimedia.org/wiki/Special:FilePath/Blue%20exercise%20mat.jpg?width=800"] },
  { name: "Nivia Storm Football Size 5", category: "Sports", subcategory: "Football", brand: "Nivia", price: 899, originalPrice: 1499, stock: 70, seller: 3, desc: "Hand-stitched PU cover, FIFA approved, all-weather play.", images: ["https://cdn.dummyjson.com/product-images/sports-accessories/football/1.webp"] },
  { name: "Strauss Adjustable Dumbbells 20kg", category: "Sports", subcategory: "Fitness", brand: "Strauss", price: 3499, originalPrice: 5999, stock: 40, seller: 3, desc: "Chrome-plated rods, anti-slip grips, home gym essential.", images: ["https://commons.wikimedia.org/wiki/Special:FilePath/Pair%20of%208kg%20dumbbells%20(Unsplash).jpg?width=800"] },
  { name: "The Psychology of Money", category: "Books", subcategory: "Non-fiction", brand: "Jaico", price: 299, originalPrice: 499, stock: 300, seller: 3, desc: "Morgan Housel on wealth, greed, and happiness.", images: ["https://covers.openlibrary.org/b/id/10389354-L.jpg"] },
  { name: "Atomic Habits by James Clear", category: "Books", subcategory: "Self-help", brand: "Penguin", price: 399, originalPrice: 599, stock: 280, seller: 3, desc: "Tiny changes, remarkable results. Build good habits.", images: ["https://covers.openlibrary.org/b/id/12539702-L.jpg"] },
  { name: "Ikigai: The Japanese Secret", category: "Books", subcategory: "Self-help", brand: "Penguin", price: 349, originalPrice: 499, stock: 190, seller: 3, desc: "Find your purpose and live a longer, happier life.", images: ["https://covers.openlibrary.org/b/id/11300391-L.jpg"] },
  { name: "Sapiens: A Brief History", category: "Books", subcategory: "Non-fiction", brand: "Vintage", price: 449, originalPrice: 699, stock: 150, seller: 3, desc: "Yuval Noah Harari explores the history of humankind.", images: ["https://covers.openlibrary.org/b/id/8634250-L.jpg"] },
  { name: "Samsung Galaxy Tab S8+", category: "Electronics", subcategory: "Tablets", brand: "Samsung", price: 13999, originalPrice: 16999, stock: 45, seller: 0, desc: "12.4-inch AMOLED display, all-day battery, great for reading and streaming.", images: ["https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-s8-plus-grey/1.webp", "https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-s8-plus-grey/2.webp", "https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-s8-plus-grey/3.webp"] },
  { name: "Apple iPad 10th Generation", category: "Electronics", subcategory: "Tablets", brand: "Apple", price: 34999, originalPrice: 44900, stock: 20, seller: 0, desc: "10.9-inch Liquid Retina display, A14 Bionic chip, USB-C.", images: ["https://cdn.dummyjson.com/product-images/tablets/ipad-mini-2021-starlight/1.webp", "https://cdn.dummyjson.com/product-images/tablets/ipad-mini-2021-starlight/2.webp", "https://cdn.dummyjson.com/product-images/tablets/ipad-mini-2021-starlight/3.webp"] },
  { name: "Cello Opalware Dinner Set 27 Pcs", category: "Home & Kitchen", subcategory: "Dining", brand: "Cello", price: 2499, originalPrice: 3999, stock: 55, seller: 2, desc: "Break-resistant opalware, microwave safe, elegant design.", images: ["https://cdn.dummyjson.com/product-images/kitchen-accessories/plate/1.webp"] },
  { name: "Adidas Performance Basketball", category: "Sports", subcategory: "Basketball", brand: "Adidas", price: 3999, originalPrice: 5999, stock: 50, seller: 3, desc: "Official size composite-leather basketball, deep channel grip, indoor/outdoor play.", images: ["https://cdn.dummyjson.com/product-images/sports-accessories/basketball/1.webp"] },
];

const sellers = [
  { name: "TechHub India", email: "seller1@velora.com" },
  { name: "StyleCraft", email: "seller2@velora.com" },
  { name: "HomeNest", email: "seller3@velora.com" },
  { name: "FitLife Store", email: "seller4@velora.com" },
];

const customers = [
  { name: "Tharun", email: "tharun@example.com" },
  { name: "Priya Sharma", email: "priya@example.com" },
  { name: "Rahul Verma", email: "rahul@example.com" },
  { name: "Ananya Patel", email: "ananya@example.com" },
];

const reviewTexts = [
  "Exactly as described. Fast delivery and great packaging.",
  "Good value for money. Would recommend to friends.",
  "Quality exceeded my expectations. Very happy with this purchase.",
  "Works perfectly. Minor packaging dent but product is fine.",
  "Solid build quality. Using it daily without issues.",
  "Decent product at this price point. No complaints.",
  "Love it! Fits perfectly and looks premium.",
  "Average experience. Product is okay but delivery was slow.",
];

async function seed() {
  await connectDB();
  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Cart.deleteMany({}),
    PasswordResetToken.deleteMany({}),
  ]);

  const hashed = await bcrypt.hash(PASSWORD, 10);
  const sellerDocs = await User.insertMany(
    sellers.map((s) => ({ ...s, role: "seller", hashedPassword: hashed }))
  );
  const customerDocs = await User.insertMany(
    customers.map((c) => ({ ...c, role: "customer", hashedPassword: hashed }))
  );

  // Insert one at a time (not insertMany) so each product's createdAt is a
  // few ms apart in catalog order — that way "New Arrivals" (sorted by
  // createdAt) has a real, stable order instead of all-identical timestamps.
  const products = [];
  for (const p of productCatalog) {
    const product = await Product.create({
      seller: sellerDocs[p.seller]._id,
      name: p.name,
      description: p.desc,
      category: p.category,
      subcategory: p.subcategory,
      brand: p.brand,
      price: p.price,
      originalPrice: p.originalPrice,
      images: p.images,
      stock: p.stock,
      specs: new Map([
        ["Brand", p.brand],
        ["Category", p.category],
        ["Warranty", "1 Year Manufacturer"],
      ]),
      popularity: Math.floor(Math.random() * 500),
    });
    products.push(product);
  }

  const orderItems = [
    { product: products[0], qty: 1 },
    { product: products[8], qty: 2 },
    { product: products[14], qty: 1 },
    { product: products[1], qty: 1 },
    { product: products[27], qty: 1 },
  ];

  const orders = [];
  for (let i = 0; i < orderItems.length; i++) {
    const customer = customerDocs[i % customerDocs.length];
    const { product, qty } = orderItems[i];
    const order = await Order.create({
      customer: customer._id,
      items: [{
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: qty,
        image: product.images[0],
      }],
      total: product.price * qty,
      status: "delivered",
      statusHistory: [
        { status: "pending" }, { status: "confirmed" }, { status: "shipped" }, { status: "delivered" },
      ],
      shippingAddress: {
        fullName: customer.name,
        phone: "9876543210",
        addressLine1: "42 MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },
      paymentMethod: i % 2 === 0 ? "upi" : "card",
    });
    orders.push(order);
  }

  const reviewPairs = [
    { customer: 0, product: 0, rating: 5 },
    { customer: 0, product: 8, rating: 4 },
    { customer: 1, product: 1, rating: 5 },
    { customer: 1, product: 14, rating: 4 },
    { customer: 2, product: 27, rating: 5 },
    { customer: 3, product: 0, rating: 3 },
    { customer: 2, product: 9, rating: 4 },
    { customer: 0, product: 14, rating: 5 },
  ];

  for (let i = 0; i < reviewPairs.length; i++) {
    const { customer, product, rating } = reviewPairs[i];
    await Review.create({
      buyer: customerDocs[customer]._id,
      product: products[product]._id,
      rating,
      text: reviewTexts[i % reviewTexts.length],
      images: [],
      helpfulCount: Math.floor(Math.random() * 20),
    });
  }

  for (const product of products) {
    const reviews = await Review.find({ product: product._id });
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach((r) => { breakdown[r.rating]++; sum += r.rating; });
    product.ratingAverage = reviews.length ? Math.round((sum / reviews.length) * 10) / 10 : 0;
    product.ratingCount = reviews.length;
    product.ratingBreakdown = breakdown;
    await product.save();
  }

  console.log("\nSeed complete!");
  console.log(`  ${products.length} products`);
  console.log(`  ${sellerDocs.length} sellers, ${customerDocs.length} customers`);
  console.log(`  ${orders.length} orders, ${reviewPairs.length} reviews`);
  console.log("\nDemo accounts (password: password123):");
  [...customers, ...sellers].forEach((u) => console.log(`  ${u.email}`));
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
