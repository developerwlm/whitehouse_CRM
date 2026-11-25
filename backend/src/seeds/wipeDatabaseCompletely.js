const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');

const wipeEntireDatabase = async () => {
  try {
    console.log('\n================================================================');
    console.log(' WHITEHOUSE CRM – TOTAL DATABASE PURGE');
    console.log(' Removing ALL collections and ALL records from MongoDB database');
    console.log('================================================================\n');

    await connectDB();

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections in database.`);

    for (const col of collections) {
      const colName = col.name;
      if (colName.startsWith('system.')) continue;
      
      const count = await db.collection(colName).countDocuments();
      await db.collection(colName).deleteMany({});
      console.log(`✓ Purged collection: ${colName} (cleared ${count} documents)`);
    }

    console.log('\n================================================================');
    console.log(' TOTAL DATABASE PURGE COMPLETED SUCCESSFULLY!');
    console.log(' Every collection has been purged to 0 documents.');
    console.log('================================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[ERROR] Failed to wipe database:', err);
    process.exit(1);
  }
};

wipeEntireDatabase();
