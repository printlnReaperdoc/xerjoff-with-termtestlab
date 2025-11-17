const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema definition (instead of importing from backend)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 3
  },
  profilePicture: {
    type: String,
    default: ''
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://axistheminecraftexpert:0829@cluster0.rzoaucu.mongodb.net/Xerjoff_mern?retryWrites=true&w=majority';

// User data to seed with profile pictures and admin status
const usersToSeed = [
  { name: 'Josh Bernabe', username: 'joshbernabe', email: 'josh.bernabe@example.com', profilePicture: '/defaultuserpic.png', isAdmin: true },
  { name: 'Loise Garcia', username: 'loisegarcia', email: 'loise.garcia@example.com', profilePicture: '/defaultuserpic.png', isAdmin: true },
  { name: 'Rovic Abonita', username: 'rovicabonita', email: 'rovic.abonita@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Flint Celetaria', username: 'flintceletaria', email: 'flint.celetaria@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Jemuel Malaga', username: 'jemuelmalaga', email: 'jemuel.malaga@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Ernz Jumoc', username: 'ernzjumoc', email: 'ernz.jumoc@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Jett Manalo', username: 'jettmanalo', email: 'jett.manalo@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'KC Lacorte', username: 'kclacorte', email: 'kc.lacorte@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Sharwin Marbella', username: 'sharwinmarbella', email: 'sharwin.marbella@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Alvin Yago', username: 'alvinyago', email: 'alvin.yago@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Evan Piad', username: 'evanpiad', email: 'evan.piad@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Justine Tomon', username: 'justinetomon', email: 'justine.tomon@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Xyrvi Mateo', username: 'xyrvimateo', email: 'xyrvi.mateo@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Jexel Talaba', username: 'jexeltalaba', email: 'jexel.talaba@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Kevin Ofracio', username: 'kevinofracio', email: 'kevin.ofracio@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Matthew Hernandez', username: 'matthewhernandez', email: 'matthew.hernandez@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Renz Madera', username: 'renzmadera', email: 'renz.madera@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Eros Tolin', username: 'erostolin', email: 'eros.tolin@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Mary Pauline Calungsod', username: 'marypaulinecalungsod', email: 'marypauline.calungsod@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Kimberly Eledia', username: 'kimberlyeledia', email: 'kimberly.eledia@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Maria Kimberly Labi-labi', username: 'mariakimberlylabi', email: 'mariakimberly.labi@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
  { name: 'Erica Peque', username: 'ericapeque', email: 'erica.peque@example.com', profilePicture: '/defaultuserpic.png', isAdmin: false },
];

// Function to seed users
const seedUsers = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully!');

    // Clear existing users (optional - remove if you don't want to delete existing data)
    console.log('Clearing existing users...');
    await User.deleteMany({});
    console.log('Existing users cleared.');

    // Hash the password
    const password = '0829';
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed successfully.');

    // Create user documents
    const userPromises = usersToSeed.map(async (userData) => {
      const user = new User({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        profilePicture: userData.profilePicture,
        isAdmin: userData.isAdmin
      });
      
      await user.save();
      const adminStatus = userData.isAdmin ? '👑 ADMIN' : '👤 USER';
      console.log(`User ${userData.name} (${userData.username}) seeded successfully. ${adminStatus}`);
      
      return user;
    });

    // Wait for all users to be saved
    await Promise.all(userPromises);
    
    // Count admin users
    const adminCount = usersToSeed.filter(user => user.isAdmin).length;
    
    console.log('\n✅ All users seeded successfully!');
    console.log(`📊 Total users seeded: ${usersToSeed.length}`);
    console.log(`👑 Admin users: ${adminCount}`);
    console.log(`👤 Regular users: ${usersToSeed.length - adminCount}`);
    console.log('🖼️  All users include profile pictures');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

// Run the seeder
seedUsers();