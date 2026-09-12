const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Admin = require('../models/Admin');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Setting = require('../models/Setting');

// Helper to generate automatic category-specific descriptions
const generateCategoryDescription = (categoryName, productName) => {
  switch (categoryName) {
    case 'Sound Crackers':
      return `Traditional loud sound cracker from Sivakasi. Produces sharp, resonant festive sonic reports with superior quality fuse.`;
    case 'Bijili Crackers':
      return `High-speed continuous crackling bijili crackers with bright red wrapping. Perfect for rapid bursts and festival energy.`;
    case 'Bombs':
      return `Heavy bass thunder bombs with high-impact acoustic blast. Crafted with strict safety standards for authentic Diwali excitement.`;
    case 'Flower Pots':
      return `Beautiful fountain-style fireworks producing vibrant showers of sparks, glowing golden rain, and multicolor beads.`;
    case 'Ground Chakkar':
      return `Dazzling ground spinners rotating at high speeds, emitting concentric circles of golden and multicolor sparkles.`;
    case 'Twinkling Star':
      return `Bright glittering star sparkles emitting radiant rhythmic twinkling lights in the night sky.`;
    case 'Rockets':
      return `High-altitude whistling aerial rockets soaring straight up and exploding into colorful sparkling starbursts.`;
    case 'Digital Wala':
      return `Modern digital multi-stage crackers delivering rapid-fire rhythm and vibrant flash effects.`;
    case 'Kids Novelties':
      return `Safe, fun, and colorful novelty fireworks designed for delightful family celebrations and children.`;
    case "Children's Color Match Box":
      return `Special color-flame novelty matchboxes safe for kids, producing enchanting colorful flames.`;
    case "Children's Gun":
      return `Exciting festive toy ring cap guns and refill ammunition with safe, crisp pop sounds.`;
    case 'Wala':
      return `Traditional linked garland crackers offering unbroken rhythmic bursts and festive sound celebrations.`;
    case 'Sparklers':
      return `Safe and colorful sparklers ideal for children and family celebrations with long burn times.`;
    case 'Ariel Fancy Shots':
      return `Premium aerial fireworks with colorful burst effects, multi-shot repeaters, and sky-illuminating peonies.`;
    case 'Gift Boxes':
      return `Curated collection of fireworks suitable for family celebrations and gifting with huge festival discount savings.`;
    default:
      return `Authentic factory-direct Sivakasi firework item crafted for safe, joyful festival celebrations.`;
  }
};

// Helper for sound level determination
const determineSoundLevel = (categoryName) => {
  if (['Sound Crackers', 'Bombs', 'Wala', 'Digital Wala'].includes(categoryName)) {
    return 'High Sound';
  }
  if (['Rockets', 'Ariel Fancy Shots'].includes(categoryName)) {
    return 'Medium Sound';
  }
  return 'Low/Kids Friendly';
};

const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/s2ccrackers';
      console.log(`🌱 Connecting to MongoDB for seeding: ${mongoURI}`);
      await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ MongoDB connected for seeding.');
    } else {
      console.log('✅ Reusing active MongoDB connection for seeding.');
    }

    // 1. Seed Admin
    const adminEmail = 'admin@s2ccrackers.com';
    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      admin = await Admin.create({
        name: 'S2C Master Admin',
        email: adminEmail,
        password: 'admin123@s2c',
        role: 'superadmin',
        isActive: true,
      });
      console.log('👑 Admin user created: admin@s2ccrackers.com / admin123@s2c');
    } else {
      console.log('ℹ️ Admin user verified.');
    }

    // 2. Seed All 15 Official Categories from PDF
    const categoriesData = [
      {
        name: 'Sound Crackers',
        slug: 'sound-crackers',
        description: 'Traditional Sivakasi loud sound crackers, 4" Lakshmi, and 5" Bahuballi crackers.',
        icon: 'Volume2',
        displayOrder: 1,
      },
      {
        name: 'Bijili Crackers',
        slug: 'bijili-crackers',
        description: 'Classic red bijili strings producing rapid crackling sounds.',
        icon: 'Zap',
        displayOrder: 2,
      },
      {
        name: 'Bombs',
        slug: 'bombs',
        description: 'Powerful paper bombs and mega flash classic bombs with resonant acoustic reports.',
        icon: 'Flame',
        displayOrder: 3,
      },
      {
        name: 'Flower Pots',
        slug: 'flower-pots',
        description: 'Beautiful fountain-style fireworks producing vibrant showers of sparks.',
        icon: 'Sparkles',
        displayOrder: 4,
      },
      {
        name: 'Ground Chakkar',
        slug: 'ground-chakkar',
        description: 'Whirling ground spinners with golden sparks, Ashoka, Special, and Deluxe spinners.',
        icon: 'RotateCw',
        displayOrder: 5,
      },
      {
        name: 'Twinkling Star',
        slug: 'twinkling-star',
        description: 'Glittering 4" twinkling stars creating magical ambient sparks.',
        icon: 'Sparkles',
        displayOrder: 6,
      },
      {
        name: 'Rockets',
        slug: 'rockets',
        description: 'High-altitude whistling rockets and sky soaring fireworks.',
        icon: 'Rocket',
        displayOrder: 7,
      },
      {
        name: 'Digital Wala',
        slug: 'digital-wala',
        description: 'Modern 90 Watts digital wala crackers for festive celebrations.',
        icon: 'Radio',
        displayOrder: 8,
      },
      {
        name: 'Kids Novelties',
        slug: 'kids-novelties',
        description: 'Safe novelty fireworks including Peacock, Helicopters, Smoke Colours, and Snake Eggs.',
        icon: 'Smile',
        displayOrder: 9,
      },
      {
        name: "Children's Color Match Box",
        slug: 'childrens-color-match-box',
        description: 'Exciting 10-in-1 Lamba color flame matches safe for kids.',
        icon: 'Box',
        displayOrder: 10,
      },
      {
        name: "Children's Gun",
        slug: 'childrens-gun',
        description: 'Surya ring cap toy guns No. 1 to No. 5, Laser Ring Guns, and ring cap ammo refills.',
        icon: 'Crosshair',
        displayOrder: 11,
      },
      {
        name: 'Wala',
        slug: 'wala',
        description: '28 Giant, 56 Giant, 50 Deluxe, 100 Wala, 1000 Wala, 2000 Wala, and 5000 Wala garlands.',
        icon: 'Flame',
        displayOrder: 12,
      },
      {
        name: 'Sparklers',
        slug: 'sparklers',
        description: 'Safe and colorful sparklers ideal for children and family celebrations.',
        icon: 'Sparkles',
        displayOrder: 13,
      },
      {
        name: 'Ariel Fancy Shots',
        slug: 'ariel-fancy-shots',
        description: 'Premium aerial fireworks with colorful burst effects, 7-shot to 60-shot cakes.',
        icon: 'Zap',
        displayOrder: 14,
      },
      {
        name: 'Gift Boxes',
        slug: 'gift-boxes',
        description: 'Curated collection of fireworks suitable for family celebrations and gifting.',
        icon: 'Gift',
        displayOrder: 15,
      },
    ];

    const categoryMap = new Map();
    for (const cat of categoriesData) {
      let catDoc = await Category.findOne({ slug: cat.slug });
      if (!catDoc) {
        catDoc = await Category.create(cat);
      } else {
        catDoc.name = cat.name;
        catDoc.description = cat.description;
        catDoc.icon = cat.icon;
        catDoc.displayOrder = cat.displayOrder;
        await catDoc.save();
      }
      categoryMap.set(cat.name, catDoc._id);
      categoryMap.set(cat.slug, catDoc._id);
    }
    console.log(`📁 Seeded/Verified ${categoriesData.length} official categories.`);

    // High quality category-matched demonstration images
    const placeholderImages = {
      'Sound Crackers': ['https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?w=800&auto=format&fit=crop&q=80'],
      'Bijili Crackers': ['https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80'],
      'Bombs': ['https://images.unsplash.com/photo-1533230807127-716675e20531?w=800&auto=format&fit=crop&q=80'],
      'Flower Pots': ['https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80'],
      'Ground Chakkar': ['https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80'],
      'Twinkling Star': ['https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80'],
      'Rockets': ['https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=800&auto=format&fit=crop&q=80'],
      'Digital Wala': ['https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80'],
      'Kids Novelties': ['https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80'],
      "Children's Color Match Box": ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80'],
      "Children's Gun": ['https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?w=800&auto=format&fit=crop&q=80'],
      'Wala': ['https://images.unsplash.com/photo-1543872084-c7bd3822856f?w=800&auto=format&fit=crop&q=80'],
      'Sparklers': ['https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80'],
      'Ariel Fancy Shots': ['https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80'],
      'Gift Boxes': ['https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80'],
    };

    // 3. Complete 62 Products from PDF (Page 1 and Page 2)
    const rawCatalog = [
      // --- PAGE 1 ---
      // Sound Crackers
      { code: '1', name: '4" Lakshmi', category: 'Sound Crackers', pcs: 5, mrp: 69, sell: 28, brand: 'NACHIYAR', stock: 370 },
      { code: '2', name: '5" Bahuballi', category: 'Sound Crackers', pcs: 5, mrp: 160, sell: 64, brand: 'Brothers', stock: 100 },
      // Bijili Crackers
      { code: '3', name: 'Color Red Bijili', category: 'Bijili Crackers', pcs: 100, mrp: 113, sell: 45, brand: 'NACHIYAR', stock: 300 },
      // Bombs
      { code: '4', name: 'Paper Bomb 1/4 kg', category: 'Bombs', pcs: 1, mrp: 125, sell: 50, brand: 'Brothers', stock: 30 },
      { code: '5', name: 'Mega Flash (Classic Bomb)', category: 'Bombs', pcs: 10, mrp: 363, sell: 145, brand: 'NACHIYAR', stock: 150 },
      // Flower Pots
      { code: '6', name: 'Flower Pots Special', category: 'Flower Pots', pcs: 10, mrp: 250, sell: 100, brand: 'NACHIYAR', stock: 180 },
      { code: '7', name: 'Flower Pots Asoka', category: 'Flower Pots', pcs: 10, mrp: 363, sell: 145, brand: 'NACHIYAR', stock: 100 },
      { code: '8', name: 'Flower Pots Super DX', category: 'Flower Pots', pcs: 2, mrp: 350, sell: 140, brand: 'NACHIYAR', stock: 70 },
      { code: '9', name: 'Flower Pots Deluxe', category: 'Flower Pots', pcs: 5, mrp: 488, sell: 195, brand: 'NACHIYAR', stock: 54 },
      { code: '10', name: 'Colour Koti', category: 'Flower Pots', pcs: 10, mrp: 563, sell: 225, brand: 'NACHIYAR', stock: 60 },
      { code: '11', name: 'Colour Koti Deluxe (UV Box)', category: 'Flower Pots', pcs: 10, mrp: 1088, sell: 435, brand: 'NACHIYAR', stock: 30 },
      { code: '12', name: 'Nova Pots (UV Box)', category: 'Flower Pots', pcs: 10, mrp: 775, sell: 310, brand: 'NACHIYAR', stock: 30 },
      { code: '13', name: 'Tri Colour Fountain', category: 'Flower Pots', pcs: 5, mrp: 850, sell: 340, brand: 'NACHIYAR', stock: 36 },
      // Ground Chakkar
      { code: '14', name: 'Ground Chakkar Ashoka', category: 'Ground Chakkar', pcs: 10, mrp: 163, sell: 65, brand: 'NACHIYAR', stock: 250 },
      { code: '15', name: 'Ground Chakkar Special', category: 'Ground Chakkar', pcs: 10, mrp: 225, sell: 90, brand: 'NACHIYAR', stock: 190 },
      { code: '16', name: 'Ground Chakkar Deluxe', category: 'Ground Chakkar', pcs: 10, mrp: 374, sell: 150, brand: 'NACHIYAR', stock: 120 },
      { code: '17', name: 'Spinner Chakkar Super Special', category: 'Ground Chakkar', pcs: 5, mrp: 425, sell: 170, brand: 'NACHIYAR', stock: 90 },
      // Twinkling Star
      { code: '18', name: 'Twinkling Star 4"', category: 'Twinkling Star', pcs: 10, mrp: 188, sell: 75, brand: 'NACHIYAR', stock: 160 },
      // Rockets
      { code: '19', name: 'Whistling Rocket', category: 'Rockets', pcs: 5, mrp: 438, sell: 175, brand: 'Brothers', stock: 30 },
      // Digital Wala
      { code: '20', name: '90 Watts', category: 'Digital Wala', pcs: 3, mrp: 438, sell: 175, brand: 'Brothers', stock: 20 },
      // Kids Novelties
      { code: '21', name: 'Peacock', category: 'Kids Novelties', pcs: 1, mrp: 525, sell: 210, brand: 'NACHIYAR', stock: 60 },
      { code: '22', name: 'Bada Peacock', category: 'Kids Novelties', pcs: 1, mrp: 1225, sell: 490, brand: 'NACHIYAR', stock: 20 },
      { code: '23', name: 'Photo Flash', category: 'Kids Novelties', pcs: 5, mrp: 175, sell: 70, brand: 'Brothers', stock: 50 },
      { code: '24', name: 'Helicopter', category: 'Kids Novelties', pcs: 5, mrp: 275, sell: 110, brand: 'NACHIYAR', stock: 90 },
      { code: '25', name: 'Smoke Colours', category: 'Kids Novelties', pcs: 5, mrp: 400, sell: 160, brand: 'Brothers', stock: 50 },
      { code: '26', name: 'Snake Egg', category: 'Kids Novelties', pcs: 10, mrp: 88, sell: 35, brand: 'Brothers', stock: 50 },

      // --- PAGE 2 ---
      { code: '27', name: 'Top Gun + 27', category: 'Kids Novelties', pcs: 5, mrp: 563, sell: 225, brand: 'Brothers', stock: 20 },
      { code: '28', name: 'Money Bank', category: 'Kids Novelties', pcs: 5, mrp: 250, sell: 100, brand: 'Brothers', stock: 30 },
      { code: '29', name: 'Chotta Fancy', category: 'Kids Novelties', pcs: 5, mrp: 125, sell: 50, brand: 'Brothers', stock: 50 },
      { code: '30', name: 'Disco Shower', category: 'Kids Novelties', pcs: 5, mrp: 300, sell: 120, brand: 'Brothers', stock: 100 },
      { code: '31', name: 'Cartoons', category: 'Kids Novelties', pcs: 10, mrp: 320, sell: 128, brand: 'Brothers', stock: 30 },
      { code: '32', name: 'Sivakasi Special Pencil', category: 'Kids Novelties', pcs: 5, mrp: 575, sell: 230, brand: 'Brothers', stock: 30 },
      // Children's Color Match Box
      { code: '33', name: 'Lamba (10 in 1 Match Box)', category: "Children's Color Match Box", pcs: 10, mrp: 500, sell: 200, brand: 'Brothers', stock: 30 },
      // Children's Gun
      { code: '34', name: 'Ring Cap Gun No. 1', category: "Children's Gun", pcs: 1, mrp: 250, sell: 100, brand: 'SURYA', stock: 19 },
      { code: '35', name: 'Ring Cap Gun No. 2', category: "Children's Gun", pcs: 1, mrp: 275, sell: 110, brand: 'SURYA', stock: 19 },
      { code: '36', name: 'Ring Cap Gun No. 3 (Black)', category: "Children's Gun", pcs: 1, mrp: 500, sell: 200, brand: 'SURYA', stock: 19 },
      { code: '37', name: 'Ring Cap Gun No. 4 (Multi color)', category: "Children's Gun", pcs: 1, mrp: 550, sell: 220, brand: 'SURYA', stock: 19 },
      { code: '38', name: 'Ring Cap Gun No. 5', category: "Children's Gun", pcs: 1, mrp: 300, sell: 120, brand: 'SURYA', stock: 19 },
      { code: '39', name: 'Laser Ring Gun', category: "Children's Gun", pcs: 1, mrp: 550, sell: 220, brand: 'SURYA', stock: 19 },
      { code: '40', name: 'Ring Cap (10nos)', category: "Children's Gun", pcs: 5, mrp: 250, sell: 100, brand: 'SURYA', stock: 34 },
      // Wala
      { code: '41', name: '28 Giant', category: 'Wala', pcs: 1, mrp: 75, sell: 30, brand: 'Brothers', stock: 100 },
      { code: '42', name: '56 Giant', category: 'Wala', pcs: 1, mrp: 138, sell: 55, brand: 'Brothers', stock: 100 },
      { code: '43', name: '50 Deluxe', category: 'Wala', pcs: 1, mrp: 225, sell: 90, brand: 'Brothers', stock: 50 },
      { code: '44', name: '100 Deluxe', category: 'Wala', pcs: 1, mrp: 475, sell: 190, brand: 'Brothers', stock: 40 },
      { code: '45', name: '100 Wala', category: 'Wala', pcs: 1, mrp: 125, sell: 50, brand: 'Brothers', stock: 60 },
      { code: '46', name: '1000 Wala (Brand)', category: 'Wala', pcs: 1, mrp: 650, sell: 260, brand: 'NACHIYAR', stock: 36 },
      { code: '47', name: '2000 Wala (Brand)', category: 'Wala', pcs: 1, mrp: 1238, sell: 495, brand: 'NACHIYAR', stock: 20 },
      { code: '48', name: '5000 Wala (Brand)', category: 'Wala', pcs: 1, mrp: 3050, sell: 1220, brand: 'NACHIYAR', stock: 7 },
      // Sparklers
      { code: '49', name: '30 CM Sparkler Colour', category: 'Sparklers', pcs: 10, mrp: 117, sell: 47, brand: 'Brothers', stock: 100 },
      { code: '50', name: '30 CM Electric Sparkler', category: 'Sparklers', pcs: 5, mrp: 108, sell: 43, brand: 'Brothers', stock: 100 },
      { code: '51', name: '30 CM Green Sparkler', category: 'Sparklers', pcs: 5, mrp: 120, sell: 48, brand: 'Brothers', stock: 100 },
      { code: '52', name: '50 CM Electric Sparkler', category: 'Sparklers', pcs: 5, mrp: 440, sell: 176, brand: 'Brothers', stock: 50 },
      // Ariel Fancy Shots
      { code: '53', name: '7 Shot', category: 'Ariel Fancy Shots', pcs: 5, mrp: 340, sell: 136, brand: 'NACHIYAR', stock: 90 },
      { code: '54', name: '2" Fancy Sky Shot', category: 'Ariel Fancy Shots', pcs: 1, mrp: 357, sell: 143, brand: 'NACHIYAR', stock: 80 },
      { code: '55', name: '3 1/2" Fancy Sky Shot', category: 'Ariel Fancy Shots', pcs: 1, mrp: 850, sell: 340, brand: 'NACHIYAR', stock: 30 },
      { code: '56', name: '12 Shot (Red & Green)', category: 'Ariel Fancy Shots', pcs: 1, mrp: 459, sell: 184, brand: 'NACHIYAR', stock: 96 },
      { code: '57', name: '30 Shot Multicolour', category: 'Ariel Fancy Shots', pcs: 1, mrp: 1225, sell: 490, brand: 'NACHIYAR', stock: 32 },
      { code: '58', name: '60 Shot Multicolour', category: 'Ariel Fancy Shots', pcs: 1, mrp: 2450, sell: 980, brand: 'Brothers', stock: 12 },
      // Gift Boxes
      { code: '59', name: '30 Items Gift Box', category: 'Gift Boxes', pcs: 1, mrp: 988, sell: 395, brand: 'Sree Balaji', stock: 7 },
      { code: '60', name: '35 Items Gift Box', category: 'Gift Boxes', pcs: 1, mrp: 1425, sell: 570, brand: 'Sree Balaji', stock: 3 },
      { code: '61', name: '40 Items Gift Box', category: 'Gift Boxes', pcs: 1, mrp: 1775, sell: 710, brand: 'Sree Balaji', stock: 19 },
      { code: '62', name: '45 Items Gift Box', category: 'Gift Boxes', pcs: 1, mrp: 1988, sell: 795, brand: 'Sree Balaji', stock: 0 },
    ];

    let seededCount = 0;
    let updatedCount = 0;

    for (const item of rawCatalog) {
      const categoryId = categoryMap.get(item.category);
      const discount = item.mrp > 0 ? Math.round(((item.mrp - item.sell) / item.mrp) * 100) : 0;
      const slug = `item-${item.code}-${item.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')}`;

      const description = generateCategoryDescription(item.category, item.name);
      const soundLevel = determineSoundLevel(item.category);
      const images = placeholderImages[item.category] || ['https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800'];
      const isFeatured = ['1', '5', '6', '14', '18', '21', '46', '49', '53', '57', '59', '61'].includes(item.code);

      const productPayload = {
        productCode: item.code,
        name: item.name,
        slug,
        category: categoryId,
        brand: item.brand,
        piecesPerPack: item.pcs,
        packSize: `${item.pcs} Pcs / Pack`,
        piecesPerBox: item.pcs,
        originalPrice: item.mrp,
        price: item.sell,
        discountPercentage: Math.max(0, discount),
        stockQuantity: item.stock,
        description,
        soundLevel,
        images,
        isFeatured,
        isActive: true,
      };

      const existing = await Product.findOne({
        $or: [{ productCode: item.code }, { slug }],
      });

      if (!existing) {
        await Product.create(productPayload);
        seededCount++;
      } else {
        Object.assign(existing, productPayload);
        await existing.save();
        updatedCount++;
      }
    }

    console.log(`🧨 Product Catalog Loaded: ${seededCount} new products created, ${updatedCount} existing products synced (Total: ${rawCatalog.length} official items).`);

    // 4. Seed Banners
    const bannersData = [
      {
        title: 'Diwali Mega Fireworks 2026',
        subtitle: 'Direct Factory Sivakasi Genuine Crackers with Up To 80% Discount',
        badge: 'FESTIVAL SPECIAL OFFER',
        discountTag: 'Save Up To 80% OFF',
        imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1920&auto=format&fit=crop&q=80',
        linkUrl: '/products',
        buttonText: 'Order Sivakasi Crackers',
        displayOrder: 1,
      },
      {
        title: 'Deluxe Family Gift Box Combos',
        subtitle: 'Curated 30 to 45 cracker varieties for unforgettable festival memories',
        badge: 'BESTSELLING COMBO',
        discountTag: 'From Only ₹395',
        imageUrl: 'https://images.unsplash.com/photo-1533230807127-716675e20531?w=1920&auto=format&fit=crop&q=80',
        linkUrl: '/products?category=gift-boxes',
        buttonText: 'View Gift Boxes',
        displayOrder: 2,
      },
      {
        title: 'Sky Shots & Night Spectaculars',
        subtitle: 'High Altitude Multishot Repeaters & Crackling Golden Willow Brocades',
        badge: 'NIGHT SHOW',
        discountTag: 'Starting at ₹136',
        imageUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1920&auto=format&fit=crop&q=80',
        linkUrl: '/products?category=ariel-fancy-shots',
        buttonText: 'Explore Aerial Shots',
        displayOrder: 3,
      },
    ];

    let insertedBanners = 0;
    for (const b of bannersData) {
      const existing = await Banner.findOne({ title: b.title });
      if (!existing) {
        await Banner.create({ ...b, isActive: true });
        insertedBanners++;
      }
    }
    console.log(`🖼️ Seeded ${insertedBanners} promotional banners.`);

    // 6. Seed Setting
    let setting = await Setting.findOne();
    if (!setting) {
      await Setting.create({
        businessName: 'S2C Crackers',
        businessDomain: 'www.s2ccrackers.com',
        phone: '+91 99444 76516',
        whatsappNumber: '919944476516',
        email: 's2ccrackers@gmail.com',
        address: 'Azhagar Crackers, 570 (East Part), Singapore Nagar, Chatitapatti, Madurai - 625014, Tamil Nadu, India',
        minimumOrderAmount: 500,
        minOrderAmount: 500,
        freeDeliveryThreshold: 3000,
        defaultDeliveryFee: 150,
        discountSlabs: [
          { minAmount: 1000, discountPercentage: 5 },
          { minAmount: 3000, discountPercentage: 10 },
          { minAmount: 5000, discountPercentage: 15 },
        ],
        deliveryMessage: 'Door Delivery Available',
        cartProgressMessage: 'Add more items to unlock benefits',
        festivalAnnouncement: '💥 SIVAKASI DIRECT FACTORY SALE! Book your Festival Crackers early & Get Up To 80% OFF. Door Delivery Available across India! 💥',
        isStoreOpen: true,
      });
      console.log('⚙️ Seeded default business settings.');
    }

    console.log('✨ DATABASE SEEDING COMPLETED SUCCESSFULLY ✨');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Database seed failed:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
