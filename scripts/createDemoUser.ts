import User from '../models/User';
import Query from '../models/Query';

export const createDemoUser = async () => {
  try {
    const demoMode = process.env.DEMO_MODE === 'true';
    
    if (!demoMode) {
      console.log('Demo mode is disabled');
      return;
    }

    const demoUsername = 'demo';
    const demoEmail = 'demo@salesscout.com';
    const demoPassword = 'Demo1234!';

    // Check if demo user already exists
    let existingDemoUser = await User.findOne({ username: demoUsername });
    
    if (existingDemoUser) {
      console.log('Demo user already exists');
      
      // Check if demo queries exist
      const existingQueries = await Query.find({ userId: existingDemoUser._id });
      if (existingQueries.length > 0) {
        console.log(`Demo user has ${existingQueries.length} queries`);
        return;
      }
      
      // If user exists but no queries, create sample queries
      await createSampleQueries(existingDemoUser._id);
      return;
    }

    // Create demo user
    const demoUser = new User({
      username: demoUsername,
      email: demoEmail,
      password: demoPassword,
      isDemo: true
    });

    await demoUser.save();
    console.log('Demo user created successfully');
    console.log('Username: demo');
    console.log('Password: Demo1234!');

    // Create sample queries for demo user
    await createSampleQueries(demoUser._id);
    
  } catch (error) {
    console.error('Error creating demo user:', error);
  }
};

const createSampleQueries = async (userId: any) => {
  try {
    const sampleQueries = [
      {
        userId,
        name: 'Gaming Deals',
        keywords: ['playstation', 'xbox', 'nintendo', 'gaming', 'console'],
        categories: [],
        intervalMinutes: 60,
        webhookUrl: 'https://discord.com/api/webhooks/example1',
        isActive: true,
        nextRun: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      },
      {
        userId,
        name: 'Electronics Sale',
        keywords: ['laptop', 'monitor', 'keyboard', 'mouse', 'headphones'],
        categories: [],
        intervalMinutes: 120,
        webhookUrl: 'https://discord.com/api/webhooks/example2',
        isActive: true,
        nextRun: new Date(Date.now() + 120 * 60 * 1000) // 2 hours from now
      },
      {
        userId,
        name: 'Food & Grocery',
        keywords: ['costco', 'grocery', 'food', 'snacks'],
        categories: [],
        intervalMinutes: 180,
        webhookUrl: 'https://discord.com/api/webhooks/example3',
        isActive: false,
        nextRun: new Date(Date.now() + 180 * 60 * 1000) // 3 hours from now
      }
    ];

    await Query.insertMany(sampleQueries);
    console.log(`Created ${sampleQueries.length} sample queries for demo user`);
  } catch (error) {
    console.error('Error creating sample queries:', error);
  }
};

