const mongoose = require('mongoose');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

let mongodProcess = null;

const startLocalMongoServer = () => {
  return new Promise((resolve, reject) => {
    const dbPath = path.resolve(__dirname, '../../../data/db');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    const potentialBinaries = [
      'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
      'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
      'mongod',
    ];

    let mongodBin = potentialBinaries.find((bin) => {
      try {
        return fs.existsSync(bin);
      } catch {
        return false;
      }
    }) || 'mongod';

    console.log(`[Database] Spawning local MongoDB from: ${mongodBin}`);
    mongodProcess = spawn(mongodBin, ['--dbpath', dbPath, '--port', '27017', '--bind_ip', '127.0.0.1']);

    let isResolved = false;

    mongodProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('Waiting for connections') || msg.includes('mongod startup complete')) {
        if (!isResolved) {
          isResolved = true;
          console.log('[Database] mongod process is ready and waiting for connections.');
          resolve();
        }
      }
    });

    mongodProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      if (!msg.includes('deprecated')) {
        console.warn(`[mongod stderr] ${msg.trim()}`);
      }
    });

    mongodProcess.on('error', (err) => {
      if (!isResolved) {
        isResolved = true;
        reject(err);
      }
    });

    mongodProcess.on('exit', (code) => {
      if (!isResolved) {
        isResolved = true;
        reject(new Error(`mongod exited with code ${code}`));
      }
    });

    // Timeout fallback after 15 seconds
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        resolve(); // Try connecting anyway
      }
    }, 15000);
  });
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/whitehouse_crm';

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log(`[Database] MongoDB Connected successfully`);
    return conn;
  } catch (initialErr) {
    if (uri.includes('mongodb+srv://')) {
      console.error('[Database] Failed to connect to MongoDB Atlas:', initialErr.message);
      throw initialErr;
    }
    console.log('[Database] Initial connection failed. Starting embedded mongod process...');
    try {
      await startLocalMongoServer();
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[Database] MongoDB Connected after starting mongod: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (startErr) {
      console.error('[Database] Fatal: Unable to connect to MongoDB:', startErr.message);
      throw startErr;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodProcess) {
    try {
      mongodProcess.kill();
    } catch (e) {}
  }
};

module.exports = { connectDB, disconnectDB };
