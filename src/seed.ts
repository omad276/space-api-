import mongoose from 'mongoose';
import { config } from './config/index.js';
import User from './models/User.js';
import Property from './models/Property.js';

// Sample properties data - Global
const sampleProperties = [
  {
    title: 'Luxury Villa in Miami Beach',
    titleAr: '',
    description:
      'Beautiful 5-bedroom villa with private pool, garden, and modern amenities. Located in the prestigious South Beach area.',
    descriptionAr: '',
    type: 'villa',
    category: 'residential',
    status: 'for_sale',
    price: 2500000,
    currency: 'USD',
    area: 450,
    bedrooms: 5,
    bathrooms: 4,
    location: {
      address: 'South Beach District',
      addressAr: '',
      city: 'Miami',
      cityAr: '',
      country: 'USA',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [-80.13, 25.7825] },
    },
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'],
    features: ['Pool', 'Garden', 'Garage', 'Smart Home', 'Security System'],
    featuresAr: [],
    isFeatured: true,
  },
  {
    title: 'Modern Apartment in London',
    titleAr: '',
    description:
      'Stunning city view apartment with 3 bedrooms. Features modern finishes and access to building amenities.',
    descriptionAr: '',
    type: 'apartment',
    category: 'residential',
    status: 'for_rent',
    price: 4500,
    currency: 'GBP',
    area: 180,
    bedrooms: 3,
    bathrooms: 2,
    location: {
      address: 'Canary Wharf',
      addressAr: '',
      city: 'London',
      cityAr: '',
      country: 'UK',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [-0.0235, 51.5054] },
    },
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
    features: ['City View', 'Gym', 'Parking', 'Concierge', 'Balcony'],
    featuresAr: [],
    isFeatured: true,
  },
  {
    title: 'Office Space in Manhattan',
    titleAr: '',
    description:
      'Premium office space in the Financial District. Perfect for businesses looking for a prestigious address.',
    descriptionAr: '',
    type: 'office',
    category: 'commercial',
    status: 'for_rent',
    price: 15000,
    currency: 'USD',
    area: 250,
    location: {
      address: 'Wall Street',
      addressAr: '',
      city: 'New York',
      cityAr: '',
      country: 'USA',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [-74.006, 40.7128] },
    },
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'],
    features: ['Meeting Rooms', '24/7 Access', 'Parking', 'High-Speed Internet', 'Reception'],
    featuresAr: [],
    isFeatured: true,
  },
  {
    title: 'Land Plot in Dubai',
    titleAr: '',
    description:
      'Prime residential land plot in Dubai. Ideal for building your dream home or investment.',
    descriptionAr: '',
    type: 'land',
    category: 'residential',
    status: 'for_sale',
    price: 800000,
    currency: 'AED',
    area: 600,
    location: {
      address: 'Palm Jumeirah',
      addressAr: '',
      city: 'Dubai',
      cityAr: '',
      country: 'UAE',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [55.1388, 25.1124] },
    },
    images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'],
    features: ['Corner Plot', 'Near Beach', 'Premium Location', 'Paved Roads'],
    featuresAr: [],
    isFeatured: false,
  },
  {
    title: 'Warehouse in Singapore',
    titleAr: '',
    description:
      'Large warehouse facility with loading docks and office space. Perfect for logistics operations.',
    descriptionAr: '',
    type: 'warehouse',
    category: 'industrial',
    status: 'for_rent',
    price: 18000,
    currency: 'SGD',
    area: 2000,
    location: {
      address: 'Jurong Industrial Estate',
      addressAr: '',
      city: 'Singapore',
      cityAr: '',
      country: 'Singapore',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [103.7066, 1.3259] },
    },
    images: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800'],
    features: ['Loading Docks', 'Office Space', 'High Ceiling', '24/7 Security', 'Fire System'],
    featuresAr: [],
    isFeatured: false,
  },
  {
    title: 'Penthouse in Sydney',
    titleAr: '',
    description:
      'Exclusive penthouse with panoramic views. Features private terrace, jacuzzi, and premium finishes.',
    descriptionAr: '',
    type: 'apartment',
    category: 'residential',
    status: 'for_sale',
    price: 3500000,
    currency: 'AUD',
    area: 350,
    bedrooms: 4,
    bathrooms: 5,
    location: {
      address: 'Harbour Bridge Area',
      addressAr: '',
      city: 'Sydney',
      cityAr: '',
      country: 'Australia',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [151.2093, -33.8688] },
    },
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
    features: ['Private Terrace', 'Jacuzzi', 'Smart Home', 'Private Elevator', 'Harbour View'],
    featuresAr: [],
    isFeatured: true,
  },
  {
    title: 'Cozy Studio in Paris',
    titleAr: '',
    description:
      'Perfect starter apartment with modern kitchen and bathroom. Close to public transport and shopping.',
    descriptionAr: '',
    type: 'apartment',
    category: 'residential',
    status: 'for_rent',
    price: 1800,
    currency: 'EUR',
    area: 45,
    bedrooms: 1,
    bathrooms: 1,
    location: {
      address: 'Le Marais District',
      addressAr: '',
      city: 'Paris',
      cityAr: '',
      country: 'France',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [2.3522, 48.8566] },
    },
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    features: ['Furnished', 'AC', 'Kitchen', 'Near Metro'],
    featuresAr: [],
    isFeatured: false,
  },
  {
    title: 'Family Villa in Toronto',
    titleAr: '',
    description:
      'Spacious family villa with 6 bedrooms, large garden, and swimming pool. Perfect for large families.',
    descriptionAr: '',
    type: 'villa',
    category: 'residential',
    status: 'for_sale',
    price: 2200000,
    currency: 'CAD',
    area: 650,
    bedrooms: 6,
    bathrooms: 5,
    location: {
      address: 'Forest Hill',
      addressAr: '',
      city: 'Toronto',
      cityAr: '',
      country: 'Canada',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [-79.4163, 43.6894] },
    },
    images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'],
    features: ['Pool', 'Garden', 'Maid Room', 'Guest Suite', 'Garage'],
    featuresAr: [],
    isFeatured: true,
  },
  {
    title: 'Commercial Building in Tokyo',
    titleAr: '',
    description:
      'Prime commercial building with multiple floors. Excellent location for retail or office use.',
    descriptionAr: '',
    type: 'building',
    category: 'commercial',
    status: 'for_sale',
    price: 50000000,
    currency: 'JPY',
    area: 3500,
    location: {
      address: 'Shibuya District',
      addressAr: '',
      city: 'Tokyo',
      cityAr: '',
      country: 'Japan',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [139.7005, 35.658] },
    },
    images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'],
    features: ['Elevator', 'Parking', 'Central AC', 'Security', 'Reception'],
    featuresAr: [],
    isFeatured: true,
  },
  {
    title: 'Beachfront Chalet in Maldives',
    titleAr: '',
    description: 'Stunning beachfront chalet with direct beach access. Perfect vacation getaway.',
    descriptionAr: '',
    type: 'villa',
    category: 'residential',
    status: 'for_rent',
    price: 5000,
    currency: 'USD',
    area: 200,
    bedrooms: 3,
    bathrooms: 2,
    location: {
      address: 'North Male Atoll',
      addressAr: '',
      city: 'Male',
      cityAr: '',
      country: 'Maldives',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [73.5093, 4.1755] },
    },
    images: ['https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800'],
    features: ['Beach Access', 'BBQ Area', 'Furnished', 'Parking'],
    featuresAr: [],
    isFeatured: false,
  },
  {
    title: 'Luxury Apartment in Berlin',
    titleAr: '',
    description: 'High-end apartment in the prestigious Mitte district with premium amenities.',
    descriptionAr: '',
    type: 'apartment',
    category: 'residential',
    status: 'for_rent',
    price: 3500,
    currency: 'EUR',
    area: 280,
    bedrooms: 4,
    bathrooms: 3,
    location: {
      address: 'Mitte District',
      addressAr: '',
      city: 'Berlin',
      cityAr: '',
      country: 'Germany',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [13.405, 52.52] },
    },
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
    features: ['Compound', 'Pool', 'Gym', 'Tennis Court', '24/7 Security'],
    featuresAr: [],
    isFeatured: true,
  },
  {
    title: 'Factory in Shanghai',
    titleAr: '',
    description: 'Large factory facility with all utilities. Ideal for manufacturing operations.',
    descriptionAr: '',
    type: 'factory',
    category: 'industrial',
    status: 'for_sale',
    price: 8500000,
    currency: 'CNY',
    area: 5000,
    location: {
      address: 'Pudong Industrial Zone',
      addressAr: '',
      city: 'Shanghai',
      cityAr: '',
      country: 'China',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [121.4737, 31.2304] },
    },
    images: ['https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800'],
    features: ['Heavy Power', 'Water Supply', 'Loading Area', 'Office', 'Worker Housing'],
    featuresAr: [],
    isFeatured: false,
  },
  {
    title: 'Modern Duplex in Amsterdam',
    titleAr: '',
    description: 'Beautiful duplex apartment with modern design and rooftop terrace.',
    descriptionAr: '',
    type: 'apartment',
    category: 'residential',
    status: 'for_sale',
    price: 950000,
    currency: 'EUR',
    area: 320,
    bedrooms: 4,
    bathrooms: 4,
    location: {
      address: 'Jordaan District',
      addressAr: '',
      city: 'Amsterdam',
      cityAr: '',
      country: 'Netherlands',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [4.8952, 52.3702] },
    },
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'],
    features: ['Duplex', 'Rooftop', 'Modern Design', 'Parking', 'Storage'],
    featuresAr: [],
    isFeatured: false,
  },
  {
    title: 'Investment Land in Monaco',
    titleAr: '',
    description:
      'Prime investment opportunity in Monaco. Strategic location for luxury development.',
    descriptionAr: '',
    type: 'land',
    category: 'residential',
    status: 'for_sale',
    price: 15000000,
    currency: 'EUR',
    area: 2000,
    location: {
      address: 'Monte Carlo',
      addressAr: '',
      city: 'Monaco',
      cityAr: '',
      country: 'Monaco',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [7.4246, 43.7384] },
    },
    images: ['https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=800'],
    features: ['Sea View', 'Investment Zone', 'Premium Location', 'Strategic Location'],
    featuresAr: [],
    isFeatured: true,
  },
  {
    title: 'Retail Shop in Hong Kong',
    titleAr: '',
    description: 'Prime retail space in busy shopping district. High foot traffic location.',
    descriptionAr: '',
    type: 'office',
    category: 'commercial',
    status: 'for_rent',
    price: 80000,
    currency: 'HKD',
    area: 80,
    location: {
      address: 'Causeway Bay',
      addressAr: '',
      city: 'Hong Kong',
      cityAr: '',
      country: 'Hong Kong',
      countryAr: '',
      coordinates: { type: 'Point', coordinates: [114.1849, 22.28] },
    },
    images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'],
    features: ['Mall Location', 'High Traffic', 'AC', 'Security'],
    featuresAr: [],
    isFeatured: false,
  },
];

// Demo users data
const demoUsers = [
  {
    email: 'buyer@upgreat.com',
    password: 'Demo123!',
    fullName: 'John Buyer',
    phone: '+1234567890',
    role: 'buyer' as const,
    isActive: true,
    isVerified: true,
  },
  {
    email: 'owner@upgreat.com',
    password: 'Demo123!',
    fullName: 'Sarah Owner',
    phone: '+1234567891',
    role: 'owner' as const,
    isActive: true,
    isVerified: true,
  },
  {
    email: 'agent@upgreat.com',
    password: 'Demo123!',
    fullName: 'Michael Agent',
    phone: '+1234567892',
    role: 'agent' as const,
    isActive: true,
    isVerified: true,
  },
  {
    email: 'admin@upgreat.com',
    password: 'Admin123!',
    fullName: 'Admin User',
    phone: '+1234567893',
    role: 'admin' as const,
    isActive: true,
    isVerified: true,
  },
];

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('📦 Connected to MongoDB');

    // Create demo users
    const createdUsers: Record<string, (typeof demoUsers)[0] & { _id: unknown }> = {};

    for (const userData of demoUsers) {
      let user = await User.findOne({ email: userData.email });

      if (!user) {
        user = await User.create(userData);
        console.log(`👤 Created ${userData.role}: ${userData.email} / ${userData.password}`);
      } else {
        user.password = userData.password;
        await user.save();
        console.log(`👤 Reset password for ${userData.role}: ${userData.email}`);
      }

      createdUsers[userData.role] = { ...userData, _id: user._id };
    }

    // Clear existing properties
    await Property.deleteMany({});
    console.log('🗑️  Cleared existing properties');

    // Assign properties to different owners (owner and agent)
    const ownerIds = [createdUsers.owner._id, createdUsers.agent._id];
    const propertiesWithOwner = sampleProperties.map((p, index) => ({
      ...p,
      owner: ownerIds[index % ownerIds.length],
      viewCount: Math.floor(Math.random() * 200) + 50,
    }));

    await Property.insertMany(propertiesWithOwner);
    console.log(`✅ Inserted ${sampleProperties.length} sample properties`);

    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('Demo Accounts:');
    console.log('┌──────────────────────────────────────────────────┐');
    console.log('│ Role     │ Email                │ Password      │');
    console.log('├──────────────────────────────────────────────────┤');
    console.log('│ Buyer    │ buyer@upgreat.com    │ Demo123!      │');
    console.log('│ Owner    │ owner@upgreat.com    │ Demo123!      │');
    console.log('│ Agent    │ agent@upgreat.com    │ Demo123!      │');
    console.log('│ Admin    │ admin@upgreat.com    │ Admin123!     │');
    console.log('└──────────────────────────────────────────────────┘');
    console.log('');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
