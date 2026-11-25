const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { User, InstituteSettings } = require('../models');

const createAdmin = async () => {
  try {
    await connectDB();
    const email = process.argv[2] || 'admin@whitehouse.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Director Admin';

    let user = await User.findOne({ email });
    if (user) {
      user.password = password;
      user.role = 'admin';
      user.name = name;
      await user.save();
      console.log(`Admin account updated: ${email} / ${password}`);
    } else {
      user = await User.create({
        name,
        email,
        password,
        role: 'admin',
        phone: '9876543210',
      });
      console.log(`Admin account created: ${email} / ${password}`);
    }

    const settingsCount = await InstituteSettings.countDocuments();
    if (settingsCount === 0) {
      await InstituteSettings.create({
        instituteName: 'Whitehouse Skill Development Institute',
        tagline: 'Empowering Creative Minds & Technical Skills',
        address: { city: 'Madurai', state: 'Tamil Nadu' },
        email: 'info@whitehouseinstitute.in',
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
};

createAdmin();
