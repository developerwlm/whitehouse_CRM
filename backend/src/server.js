const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');
const { setSocketIO } = require('./services/notificationService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Setup HTTP Server and Socket.IO
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    });

    setSocketIO(io);

    io.on('connection', (socket) => {
      // Room subscription by user ID or role
      socket.on('join', (data) => {
        if (data.userId) {
          socket.join(`user:${data.userId}`);
        }
        if (data.role) {
          socket.join(`role:${data.role}`);
        }
      });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[Server Error] Port ${PORT} is already in use by another process.`);
        console.error(`[Server Solution] To free port ${PORT}, run:`);
        console.error(`  Get-NetTCPConnection -LocalPort ${PORT} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n`);
      } else {
        console.error('[Server Error]', err.message);
      }
      process.exit(1);
    });

    server.listen(PORT, () => {
      console.log(`[Server] Whitehouse CRM Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
