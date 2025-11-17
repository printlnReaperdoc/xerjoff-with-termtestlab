const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Connection String
const MONGODB_URI = 'mongodb+srv://axistheminecraftexpert:0829@cluster0.rzoaucu.mongodb.net/Xerjoff_mern?retryWrites=true&w=majority&appName=Cluster0';

// Product Schema
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  collection: { type: String, required: true },
  price: { type: Number, required: true },
  notes: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  rating: { type: Number, default: 4.5 },
  inStock: { type: Boolean, default: true },
  category: { type: String, required: true },
  volume: { type: String, default: '100ml' },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', ProductSchema);

// 15 Xerjoff Products
const xerjoffProducts = [
  {
    name: "Naxos",
    collection: "V Collection",
    price: 295,
    notes: "Lavender, Honey, Tobacco, Vanilla",
    description: "A captivating blend of fresh Sicilian bergamot and lavender mixed with honey, cinnamon and cashmeran. A sophisticated tobacco and tonka base creates an unforgettable signature scent.",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop",
    rating: 4.9,
    category: "Oriental",
    volume: "100ml",
    inStock: true
  },
  {
    name: "Erba Pura",
    collection: "XJ Collection",
    price: 285,
    notes: "Sicilian Orange, Mediterranean Fruits, Amber, Vanilla",
    description: "A luminous and sensual fragrance combining fresh citrus with exotic Mediterranean fruits. The warmth of amber and vanilla creates a memorable sweet gourmand experience.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=500&fit=crop",
    rating: 4.8,
    category: "Fruity",
    volume: "100ml",
    inStock: true
  },
  {
    name: "Renaissance",
    collection: "V Collection",
    price: 310,
    notes: "Fig, Bergamot, Juniper, Woody Notes",
    description: "An aromatic woody fragrance inspired by Italian art and culture. Fresh fig and bergamot open the composition, while juniper and cedar create a refined masculine signature.",
    image: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&h=500&fit=crop",
    rating: 4.7,
    category: "Woody",
    volume: "100ml",
    inStock: true
  },
  {
    name: "Accento",
    collection: "XJ Collection",
    price: 275,
    notes: "Pineapple, Hyacinth, Pink Pepper, Vetiver",
    description: "A vibrant and sophisticated fragrance featuring juicy pineapple and delicate hyacinth. Pink pepper adds spice while vetiver grounds the composition with earthy elegance.",
    image: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400&h=500&fit=crop",
    rating: 4.9,
    category: "Fresh",
    volume: "100ml",
    inStock: true
  },
  {
    name: "Alexandria II",
    collection: "XJ Collection",
    price: 290,
    notes: "Lavender, Rosemary, Apple, Cedar",
    description: "A powerful and long-lasting fragrance combining aromatic lavender and rosemary with crisp apple. Cedarwood and ambergris create a deep, luxurious foundation.",
    image: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=500&fit=crop",
    rating: 4.8,
    category: "Aromatic",
    volume: "100ml",
    inStock: true
  },
  {
    name: "Mefisto Gentiluomo",
    collection: "XJ Collection",
    price: 265,
    notes: "Lavender, Grapefruit, Bergamot, Iris",
    description: "An elegant and refined composition celebrating the Italian gentleman. Fresh citrus notes blend with aromatic lavender and powdery iris for timeless sophistication.",
    image: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&h=500&fit=crop",
    rating: 4.6,
    category: "Citrus",
    volume: "100ml",
    inStock: true
  },
  {
    name: "Torino21",
    collection: "V Collection",
    price: 320,
    notes: "Pine, Patchouli, Incense, Amber",
    description: "A tribute to Turin with its rich history and baroque architecture. Pine needles and incense create a mystical atmosphere, grounded by patchouli and amber.",
    image: "https://images.unsplash.com/photo-1528727895681-e5e5e5c24ec2?w=400&h=500&fit=crop",
    rating: 4.7,
    category: "Woody",
    volume: "100ml",
    inStock: true
  },
  {
    name: "Italica",
    collection: "XJ Collection",
    price: 280,
    notes: "Almond, Milk, Vanilla, Sandalwood",
    description: "An opulent gourmand fragrance inspired by Italian gelato. Rich almond and creamy milk blend with smooth vanilla and precious sandalwood for an indulgent experience.",
    image: "https://images.unsplash.com/photo-1582274528667-1e8a10ded835?w=400&h=500&fit=crop",
    rating: 4.9,
    category: "Gourmand",
    volume: "100ml",
    inStock: true
  },
  {
    name: "Uden",
    collection: "Oud Stars",
    price: 350,
    notes: "Oud, Saffron, Rose, Amber",
    description: "A luxurious oud fragrance featuring precious Laotian oud wood. Exotic saffron and Bulgarian rose enhance the composition with Middle Eastern opulence.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&h=500&fit=crop",
    rating: 4.8,
    category: "Oud",
    volume: "50ml",
    inStock: true
  },
  {
    name: "Richwood",
    collection: "XJ 1861",
    price: 330,
    notes: "Whiskey, Oak, Labdanum, Patchouli",
    description: "An aristocratic fragrance inspired by aged whiskey and oak barrels. Rich labdanum and earthy patchouli create a distinguished and masculine character.",
    image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=500&fit=crop",
    rating: 4.7,
    category: "Woody",
    volume: "100ml",
    inStock: true
  },
  {
    name: "Cruz del Sur II",
    collection: "Shooting Stars",
    price: 295,
    notes: "Mint, Lavender, Vetiver, Amber",
    description: "A fresh and aromatic fragrance inspired by the Southern Cross constellation. Cool mint and lavender meet warm vetiver and amber in perfect harmony.",
    image: "https://images.unsplash.com/photo-1567201080580-bfcc97dae346?w=400&h=500&fit=crop",
    rating: 4.6,
    category: "Aromatic",
    volume: "100ml",
    inStock: true
  },
  {
    name: "Amber Gold",
    collection: "Join The Club",
    price: 305,
    notes: "Amber, Vanilla, Patchouli, Benzoin",
    description: "A warm and enveloping amber fragrance with golden radiance. Rich vanilla and smooth benzoin create a luxurious and comforting oriental experience.",
    image: "https://images.unsplash.com/photo-1541108564003-32069ba57320?w=400&h=500&fit=crop",
    rating: 4.8,
    category: "Oriental",
    volume: "100ml",
    inStock: true
  },
  {
    name: "Nio",
    collection: "XJ Collection",
    price: 270,
    notes: "Bergamot, Neroli, Musk, Amber",
    description: "A fresh and clean fragrance perfect for any occasion. Sparkling bergamot and orange blossom rest on a soft bed of musk and amber.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=400&h=500&fit=crop",
    rating: 4.5,
    category: "Fresh",
    volume: "100ml",
    inStock: true
  },
  {
    name: "Casamorati 1888",
    collection: "Casamorati",
    price: 260,
    notes: "Saffron, Carnation, Oud, Sandalwood",
    description: "A tribute to the historic Casamorati perfume house. Exotic saffron and spicy carnation blend with precious oud and creamy sandalwood.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&h=500&fit=crop",
    rating: 4.7,
    category: "Spicy",
    volume: "100ml",
    inStock: true
  },
  {
    name: "V Absolute",
    collection: "V Collection",
    price: 340,
    notes: "Iris, Orris, Vetiver, Tonka Bean",
    description: "An intense and sophisticated interpretation of the V collection. Powdery iris meets earthy vetiver and sweet tonka bean for a refined unisex fragrance.",
    image: "https://images.unsplash.com/photo-1588405748717-c0e56d5dc1e2?w=400&h=500&fit=crop",
    rating: 4.9,
    category: "Floral",
    volume: "100ml",
    inStock: true
  }
];

// Seed Function
async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert new products
    const insertedProducts = await Product.insertMany(xerjoffProducts);
    console.log(`✨ Successfully seeded ${insertedProducts.length} Xerjoff products!`);

    // Display seeded products
    console.log('\n📦 Seeded Products:');
    insertedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ${product.collection} - $${product.price}`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedProducts();