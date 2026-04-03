/**
 * 🚀 Fatimah Financial Hub - Main Server
 * 📊 Educational platform for finance, trading, and real-time communication
 * 💰 Built for students, by students
 */

const basicAuth = require('express-basic-auth');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const server = http.createServer(app);

const fs = require('fs');
const telephonyUsers = new Map(); // For video chat

require('dotenv').config();

const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// ========== CONFIGURATION ==========
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fatimah-financial-hub';

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from trading directory for simulator JS/CSS
app.use('/trading', express.static(path.join(__dirname, 'trading')));

// ========== DATABASE CONNECTION ==========
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ MongoDB Connected - Data will be saved to cloud');
    })
    .catch(err => {
      console.log('MongoDB connection error:', err.message);
      console.log('📦 Falling back to file storage for messages');
    });
} else {
  console.log('📦 No MongoDB URI. Using file storage for messages');
  console.log('💡 Add MONGODB_URI environment variable to enable cloud database');
}


// Add this to your server.js for future use
async function migrateUserData(username, localData) {
  if (process.env.NODE_ENV !== 'production') return;
  
  try {
    // Find or create user in MongoDB
    let user = await User.findOne({ username });
    
    if (!user) {
      user = new User({
        username,
        portfolio: localData.portfolio,
        transactions: localData.transactions,
        createdAt: new Date()
      });
    } else {
      // Merge data (keep most recent)
      user.portfolio = { ...user.portfolio, ...localData.portfolio };
      user.lastActive = new Date();
    }
    
    await user.save();
    console.log(`✅ User ${username} data migrated to cloud`);
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// ========== DATABASE SCHEMAS ==========
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, sparse: true },
  portfolioValue: { type: Number, default: 100000 },
  virtualCash: { type: Number, default: 100000 },
  created: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  
  // Trading Profile
  riskTolerance: { 
    type: String, 
    enum: ['Conservative', 'Moderate', 'Aggressive'], 
    default: 'Moderate' 
  },
  tradingStyle: { 
    type: String, 
    enum: ['Day Trader', 'Swing Trader', 'Investor', 'Algorithmic'], 
    default: 'Investor' 
  },
  
  // Statistics
  totalTrades: { type: Number, default: 0 },
  winningTrades: { type: Number, default: 0 },
  totalProfit: { type: Number, default: 0 },
  
  // Watchlist
  watchlist: [{ 
    symbol: String,
    name: String,
    added: { type: Date, default: Date.now }
  }],
  
  // Holdings (Virtual Portfolio)
  holdings: [{
    symbol: String,
    name: String,
    quantity: Number,
    avgPrice: Number,
    currentPrice: Number,
    change: Number,
    added: Date
  }],
  
  // Trade History
  trades: [{ 
    tradeId: String,
    symbol: String, 
    name: String,
    action: { type: String, enum: ['BUY', 'SELL', 'SHORT'] }, 
    quantity: Number, 
    price: Number,
    totalValue: Number,
    fees: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['COMPLETED', 'PENDING', 'CANCELLED'], default: 'COMPLETED' }
  }],
  
  // Trading Algorithms
  algorithms: [{ 
    algorithmId: String,
    name: String, 
    description: String,
    code: String, 
    language: { type: String, default: 'javascript' },
    parameters: Object,
    performance: {
      totalReturn: Number,
      sharpeRatio: Number,
      maxDrawdown: Number,
      winRate: Number,
      backtestPeriod: String
    },
    isPublic: { type: Boolean, default: false },
    created: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
  }]
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// ========== SOCKET.IO FOR TELEPHONY/CHAT ==========
const connectedUsers = new Map();
const onlineTraders = new Map();
const messageHistory = new Map();
const simpleUsers = new Map();
const videoUsers = new Map(); // socketId -> video user data

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // ALL socket.on handlers MUST be INSIDE this block
  // =================================================
  
  // Register telephony user (for complex telephony page)
  socket.on('telephony-register', (userData) => {
    console.log('📞 Received register-telephony-user:', userData);    

    const user = {
      id: socket.id,
      name: userData.name || `Trader${Math.floor(Math.random() * 1000)}`,
      joined: new Date()
    };
    onlineTraders.set(socket.id, user);
    
    // Send user list to this client
    const users = Array.from(onlineTraders.values()).map(u => ({
      id: u.id,
      name: u.name,
      status: 'online'
    }));

    console.log('📞 Sending telephony-users to client:', users);
    socket.emit('telephony-users', users);
    
    // Broadcast to others that user joined
    socket.broadcast.emit('user-joined-telephony', {
      id: socket.id,
      name: user.name,
      status: 'online'
    });
    
    console.log(`📞 Telephony user registered: ${user.name}`);
  });
  
  // Get telephony users list
  socket.on('get-telephony-users', () => {
    const users = Array.from(onlineTraders.values()).map(u => ({
      id: u.id,
      name: u.name,
      status: 'online'
    }));
    socket.emit('telephony-users', users);
  });


  // User registration - SIMPLIFIED VERSION
  socket.on('register-user', async (userData) => {
    try {
      const username = userData?.username || 'Anonymous';
      console.log('📝 Registration attempt:', username);
     
      // Load recent messages from database
      let recentMessages = [];
      try {
        recentMessages = await ChatMessage.find()
          .sort({ timestamp: -1 })
          .limit(50)
          .lean();
        recentMessages.reverse();
        console.log(`📜 Loaded ${recentMessages.length} recent messages`);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
      console.log('📝 Socket ID:', socket.id);
         
      
      // Generate a simple user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const user = {
        id: userId,
        username: username,
        portfolioValue: 100000,
        virtualCash: 100000,
        joined: new Date()
      };
      
      // Store connection
      onlineTraders.set(socket.id, user);
      
      console.log('📊 Online traders count:', onlineTraders.size);
      console.log('📋 Current online users:', Array.from(onlineTraders.values()).map(u => u.username));
      
      // Send user data to client
      socket.emit('user-registered', {
        success: true,
        user: {
          id: userId,
          username: username,
          portfolioValue: 100000,
          virtualCash: 100000
        }
        messageHistory: recentMessages  // Add this line
      });
      
      // Broadcast to others that user joined
      socket.broadcast.emit('user-joined', {
        userId: userId,
        username: username,
        timestamp: new Date()
      });
      
      // Send list of online traders to new user
      const onlineUsers = Array.from(onlineTraders.values())
        .filter(u => u.id !== userId)
        .map(u => ({ id: u.id, username: u.username }));
      
      console.log('📤 Sending online users to new user:', onlineUsers);
      socket.emit('online-users', onlineUsers);
      
      // Also update all clients with new user list
      const allUsers = Array.from(onlineTraders.values()).map(u => ({
        id: u.id,
        username: u.username
      }));
      io.emit('online-users', allUsers);
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      socket.emit('registration-error', { error: error.message });
    }
  });

  // Register for video chat
  socket.on('register-telephony', (data) => {
    const user = {
      id: socket.id,
      name: data.name || 'Trader',
      joined: new Date()
    };
    telephonyUsers.set(socket.id, user);
    
    // Send updated list to everyone
    const allUsers = Array.from(telephonyUsers.values());
    io.emit('telephony-users', allUsers);
    
    // Notify others
    socket.broadcast.emit('user-joined-telephony', user);
    console.log(`📹 Video user registered: ${user.name}`);
  });
 
  // ========== VIDEO CHAT HANDLERS ==========
  socket.on('register-video-user', (data) => {
      const { username } = data;
      console.log('📹 Registering user:', username, 'socket:', socket.id);
      
      const user = {
          userId: socket.id,
          username: username,
          joined: new Date()
      };
      
      videoUsers.set(socket.id, user);
      
      console.log('📹 Total video users:', videoUsers.size);
      console.log('📹 Users list:', Array.from(videoUsers.values()).map(u => u.username));
      
      const usersList = Array.from(videoUsers.values());
      io.emit('video-users', usersList);
      socket.emit('video-user-registered', { 
          success: true, 
          username, 
          users: usersList 
      });
      socket.broadcast.emit('user-joined-video', user);
  });
  
  socket.on('video-chat-message', (data) => {
      const { message, username } = data;
      io.emit('video-chat-message', { message, username, timestamp: new Date() });
  });
    
  
  // Handle disconnect
  socket.on('disconnect', () => {
      const userData = onlineTraders.get(socket.id);
      if (userData) {
          console.log('👋 User disconnected:', userData.username);
          onlineTraders.delete(socket.id);
          connectedUsers.delete(userData.userId);
          socket.broadcast.emit('user-left', {
              userId: userData.userId,
              username: userData.username
          });
          const onlineUsers = Array.from(onlineTraders.values());
          io.emit('online-users', onlineUsers);
      }
      
      // ADD THIS VIDEO USER CLEANUP
      const videoUser = videoUsers.get(socket.id);
      if (videoUser) {
          console.log('📹 Video user disconnected:', videoUser.username);
          videoUsers.delete(socket.id);
          io.emit('user-left-video', videoUser);
          const usersList = Array.from(videoUsers.values());
          io.emit('video-users', usersList);
      }
      
      // Simple users cleanup
      simpleUsers.delete(socket.id);
      const userList = Array.from(simpleUsers.values()).map(u => ({
          id: u.id,
          name: u.name
      }));
      io.emit('users', userList);
  }); 

  // Chat messages - WITH MONGODB STORAGE (fixed version)
  socket.on('send-message', async (messageData) => {
    console.log('💬 Message received from socket:', socket.id);
    
    const userData = onlineTraders.get(socket.id);
    
    if (!userData) {
      console.log('❌ No user data found');
      socket.emit('message-error', { error: 'You must register first' });
      return;
    }
    
    console.log('👤 Sender:', userData.username);
    
    // Save to MongoDB (without blocking the response)
    try {
      const chatMessage = new ChatMessage({
        username: userData.username,
        message: messageData.message,
        userId: userData.id,
        timestamp: new Date()
      });
      await chatMessage.save();
      console.log(`✅ Chat message saved from ${userData.username}`);
    } catch (err) {
      console.error('❌ Failed to save message:', err);
    }
    
    const chatMessageData = {
      userId: userData.id,
      username: userData.username,
      message: messageData.message,
      timestamp: new Date(),
      type: messageData.type || 'chat'
    };
    
    // Broadcast to all OTHER clients
    socket.broadcast.emit('new-message', chatMessageData);
    socket.emit('message-sent', { success: true });
  });  


  // Trading actions
  socket.on('place-trade', async (tradeData) => {   // <-- This must be inside
    try {
      const { userId, symbol, action, quantity, price } = tradeData;
      
      const trade = {
        tradeId: `TRADE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol,
        action,
        quantity,
        price,
        totalValue: quantity * price,
        timestamp: new Date(),
        status: 'COMPLETED'
      };
      
      io.emit('trade-executed', {
        trade,
        userId,
        timestamp: new Date()
      });
      
      console.log(`💰 Trade executed: ${action} ${quantity} ${symbol} @ $${price}`);
      
    } catch (error) {
      console.error('Trade error:', error);
      socket.emit('trade-error', { error: error.message });
    }
  });
  
  // Algorithm execution
  socket.on('execute-algorithm', (algorithmData) => {
    console.log('🤖 Algorithm execution requested:', algorithmData.name);
  });
  
  // Join trading room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
    socket.emit('room-joined', { roomId });
  });

  // SIMPLE TELECOM handlers
  socket.on('get-users', () => {
    const userList = Array.from(simpleUsers.values()).map(u => ({
      id: u.id,
      name: u.name || `User_${u.id.substring(0, 6)}`
    }));
    socket.emit('users', userList);
  });

  socket.on('register-simple-user', (userData) => {
    simpleUsers.set(socket.id, {
      id: socket.id,
      name: userData.name || `Trader${Math.floor(Math.random() * 1000)}`,
      joined: new Date()
    });
    const userList = Array.from(simpleUsers.values()).map(u => ({
      id: u.id,
      name: u.name
    }));
    io.emit('users', userList);
  });


  // WebRTC signaling
  socket.on('offer', (data) => {
    io.to(data.to).emit('offer', {
      offer: data.offer,
      from: socket.id
    });
  });

  socket.on('answer', (data) => {
    io.to(data.to).emit('answer', {
      answer: data.answer,
      from: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    io.to(data.to).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  // WebRTC Offer
  socket.on('webrtc-offer', (data) => {
    console.log('📞 [SERVER] Received webrtc-offer:', {
      from: socket.id,
      to: data.to,
      hasOffer: !!data.offer
    });
    io.to(data.to).emit('webrtc-offer', {
      offer: data.offer,
      from: socket.id,
      caller: data.caller
    });
  });


  // WebRTC Answer
  socket.on('webrtc-answer', (data) => {
    console.log('✅ [SERVER] Received webrtc-answer:', {
      from: socket.id,
      to: data.to
    });
    io.to(data.to).emit('webrtc-answer', {
      answer: data.answer,
      from: socket.id
    });
  });


  socket.on('webrtc-ice-candidate', (data) => {
    io.to(data.to).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  socket.on('webrtc-end-call', (data) => {
    io.to(data.to).emit('webrtc-end-call', {
      from: socket.id
    });
  });

  socket.on('webrtc-reject-call', (data) => {
    io.to(data.to).emit('webrtc-reject-call', {
      from: socket.id
    });
  });

  socket.on('end-call', (data) => {
    io.to(data.to).emit('call-ended');
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    
    // Get user data before removing
    const telephonyUser = onlineTraders.get(socket.id);
    const simpleUser = simpleUsers.get(socket.id);
    
    // Remove from simple users
    if (simpleUser) {
      simpleUsers.delete(socket.id);
      const userList = Array.from(simpleUsers.values()).map(u => ({
        id: u.id,
        name: u.name
      }));
      io.emit('users', userList);
      console.log(`👋 Simple user left: ${simpleUser.name}`);
    }
    
    // Remove from telephony users
    if (telephonyUser) {
      onlineTraders.delete(socket.id);
      
      // Broadcast updated telephony users list
      const telephonyUsers = Array.from(onlineTraders.values()).map(user => ({
        id: user.id,
        name: user.name,
        status: 'online'
      }));
      io.emit('telephony-users', telephonyUsers);
      io.emit('user-left-telephony', { id: socket.id, name: telephonyUser.name });
      console.log(`📞 Telephony user left: ${telephonyUser.name}`);
    }
    
    // Also remove from connectedUsers if exists
    if (telephonyUser?.userId) {
      connectedUsers.delete(telephonyUser.userId);
    }
    
    // Broadcast user-left for simple chat
    if (simpleUser) {
      socket.broadcast.emit('user-left', {
        userId: socket.id,
        username: simpleUser.name,
        timestamp: new Date()
      });
    }
  }); 

  
}); // <-- This closes io.on('connection', ...) - only ONE at the end


// ========== FRED API PROXY (Real-Time Rates) ==========
// This proxy solves CORS issues when fetching from FRED API
app.get('/api/fred/:seriesId', async (req, res) => {
    try {
        const { seriesId } = req.params;
        const { limit = '1', sort_order = 'desc' } = req.query;
        
        // Get API key from environment variable or use demo
        const apiKey = process.env.FRED_API_KEY || 'demo';
        
        // If using demo key, return realistic mock data
        if (apiKey === 'demo') {
            console.log(`📊 FRED Proxy: Using demo data for ${seriesId}`);
            
            // Realistic mock data for 2026
            const mockData = {
                'MORTGAGE30US': { 
                    observations: [{ 
                        realtime_start: '2026-01-22', 
                        realtime_end: '2026-01-22', 
                        date: '2026-01-22', 
                        value: '6.09'  // Your actual rate from test
                    }] 
                },
                'FEDFUNDS': { 
                    observations: [{ 
                        realtime_start: '2026-01-22', 
                        realtime_end: '2026-01-22', 
                        date: '2026-01-22', 
                        value: '4.50' 
                    }] 
                },
                'GS10': { 
                    observations: [{ 
                        realtime_start: '2026-01-22', 
                        realtime_end: '2026-01-22', 
                        date: '2026-01-22', 
                        value: '4.20' 
                    }] 
                },
                'SP500': { 
                    observations: [{ 
                        realtime_start: '2026-01-22', 
                        realtime_end: '2026-01-22', 
                        date: '2026-01-22', 
                        value: '5250.75' 
                    }] 
                },
                'CPIAUCSL': { 
                    observations: [{ 
                        realtime_start: '2026-01-22', 
                        realtime_end: '2026-01-22', 
                        date: '2026-01-22', 
                        value: '2.8' 
                    }] 
                }
            };
            
            const data = mockData[seriesId] || { 
                observations: [{ 
                    realtime_start: '2026-01-22', 
                    realtime_end: '2026-01-22', 
                    date: '2026-01-22', 
                    value: '5.0' 
                }] 
            };
            
            return res.json(data);
        }
        
        // Build FRED API URL
        const url = `https://api.stlouisfed.org/fred/series/observations` +
            `?series_id=${seriesId}` +
            `&api_key=${apiKey}` +
            `&file_type=json` +
            `&limit=${limit}` +
            `&sort_order=${sort_order}`;
        
        console.log(`📊 FRED Proxy: Fetching ${seriesId} from ${url.substring(0, 80)}...`);
        
        // Fetch from FRED
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`FRED API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Log success
        if (data.observations && data.observations.length > 0) {
            console.log(`✅ FRED Proxy: Successfully fetched ${seriesId} = ${data.observations[0].value} (${data.observations[0].date})`);
        } else {
            console.log(`⚠️ FRED Proxy: No data for ${seriesId}`);
        }
        
        // Return FRED data
        res.json(data);
        
    } catch (error) {
        console.error('❌ FRED Proxy Error:', error.message);
        
        // Return error with fallback
        res.status(500).json({ 
            error: error.message,
            message: 'Using fallback data',
            observations: [{
                realtime_start: '2026-01-22',
                realtime_end: '2026-01-22',
                date: '2026-01-22',
                value: '6.09'  // Fallback to your actual rate
            }]
        });
    }
});

// ========== ADMIN PROTECTION ==========
// Protect admin routes with password
app.use('/admin', basicAuth({
    users: { 'admin': 'Fatimah2026' }, // Change this password!
    challenge: true,
    realm: 'Admin Area'
}));

// Admin Dashboard (protected)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/admin/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Admin messages page
app.get('/admin/messages', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'messages.html'));
});

// Test endpoint for FRED proxy
app.get('/api/test-fred', async (req, res) => {
    try {
        const apiKey = process.env.FRED_API_KEY || 'demo';
        const testUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`;
        
        const response = await fetch(testUrl);
        const data = await response.json();
        
        res.json({
            success: true,
            apiKeyLength: apiKey === 'demo' ? 4 : apiKey.length,
            apiKeyType: apiKey === 'demo' ? 'demo' : 'real',
            data: {
                rate: data.observations?.[0]?.value || 'No data',
                date: data.observations?.[0]?.date || 'No date',
                series: 'MORTGAGE30US'
            },
            message: apiKey === 'demo' ? 'Using demo mode - set FRED_API_KEY for real data' : 'Real API key detected'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Check your FRED_API_KEY environment variable'
        });
    }
});

// ========== API KEY ENDPOINT ==========
app.get('/api/config/gold-key', (req, res) => {
    // Only send if API key exists in environment
    const apiKey = process.env.GOLD_API_KEY || null;
    if (apiKey) {
        res.json({ apiKey: apiKey });
    } else {
        res.json({ apiKey: null });
    }
});

// ========== API KEY ENDPOINT ==========
app.get('/api/config/keys', (req, res) => {
    // Only send API key in development or with authentication
    // For security, don't expose the key to the client directly
    res.json({
        goldApiAvailable: !!process.env.GOLD_API_KEY,
        // Never send the actual key to the client!
    });
});

// ========== ROUTES ==========

// About page
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about', 'index.html'));
});

// Test route
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

// SIMPLE TEST ROUTE
app.get('/test-simple', (req, res) => {
    res.send('Server is working!');
});

// Debug: Check online traders
app.get('/debug/online-traders', (req, res) => {
  const traders = Array.from(onlineTraders.values());
  res.json({ count: traders.length, traders });
});

// Test serving a specific file directly
app.get('/test-riba', (req, res) => {
    res.sendFile('/home/fatimah/fatimah-financial-hub/trading/learn/islamic-perspectives/01-riba-explained.html');
});

// Legal pages
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'legal', 'privacy.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'legal', 'terms.html'));
});

// Home Page - Financial Dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Telephony Interface
app.get('/telephony', (req, res) => {
  res.sendFile(path.join(__dirname, 'telephony', 'index.html'));
});

// Video chat page
app.get('/telephony/video-chat.html', (req, res) => {
    const filePath = path.join(__dirname, 'telephony', 'video-chat.html');
    console.log('📹 Trying to serve video chat from:', filePath);
    res.sendFile(filePath);
});

// Simple Telephony Interface
app.get('/telephony/simple.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'telephony', 'simple.html'));
});

// Keep complex version accessible if needed
app.get('/telephony/complex', (req, res) => {
  res.sendFile(path.join(__dirname, 'telephony', 'index.html.complex'));
});


// Financial Tools Dashboard
app.get('/finance-tools', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'index.html'));
});

// Investment Hub
app.get('/finance-tools/investment', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'investment', 'index.html'));
});

app.get('/finance-tools/investment/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'investment', 'index.html'));
});

// Individual Investment Tools
app.get('/finance-tools/investment/stock-valuation.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'investment', 'stock-valuation.html'));
});

app.get('/finance-tools/investment/real-estate.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'investment', 'real-estate.html'));
});

app.get('/finance-tools/investment/portfolio-analyzer.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'investment', 'portfolio-analyzer.html'));
});

// Business Finance Hub
app.get('/finance-tools/business', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'business', 'index.html'));
});

app.get('/finance-tools/business/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'business', 'index.html'));
});

// Individual Business Tools
app.get('/finance-tools/business/npv-irr.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'business', 'npv-irr.html'));
});

app.get('/finance-tools/business/break-even.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'business', 'break-even.html'));
});

app.get('/finance-tools/business/cash-flow.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'business', 'cash-flow.html'));
});

app.get('/finance-tools/business/roi-calculator.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'business', 'roi-calculator.html'));
});

app.get('/finance-tools/business/valuation-calculator.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'business', 'valuation-calculator.html'));
});

app.get('/finance-tools/business/profit-margin-calculator.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'business', 'profit-margin-calculator.html'));
});

// Islamic Finance Tools
app.get('/finance-tools/islamic', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'islamic', 'index.html'));
});

app.get('/finance-tools/islamic/sukuk-calculator.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-tools', 'islamic', 'sukuk-calculator.html'));
});

// Trading Simulator
app.get('/trading', (req, res) => {
  res.sendFile(path.join(__dirname, 'trading', 'index.html'));
});

// Trading Lessons
app.get('/trading/learn/fundamentals/01-order-types.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'trading', 'learn', 'fundamentals', '01-order-types.html'));
});

app.get('/trading/learn/fundamentals/02-technical-analysis.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'trading', 'learn', 'fundamentals', '02-technical-analysis.html'));
});

app.get('/trading/learn/fundamentals/03-indicators.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'trading', 'learn', 'fundamentals', '03-indicators.html'));
});

app.get('/trading/learn/fundamentals/04-risk-management.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'trading', 'learn', 'fundamentals', '04-risk-management.html'));
});

// Add this debug route after your existing simulator routes
app.get('/debug/simulator', (req, res) => {
    const fs = require('fs');
    const simulatorPath = path.join(__dirname, 'trading/simulator/index.html');
    const simulatorDir = path.join(__dirname, 'trading/simulator');
    
    let fileExists = false;
    let directoryContents = [];
    
    try {
        fileExists = fs.existsSync(simulatorPath);
        if (fs.existsSync(simulatorDir)) {
            directoryContents = fs.readdirSync(simulatorDir);
        }
    } catch (e) {
        console.error(e);
    }
    
    res.json({
        working_directory: process.cwd(),
        __dirname: __dirname,
        simulator_path: simulatorPath,
        file_exists: fileExists,
        directory_exists: fs.existsSync(simulatorDir),
        directory_contents: directoryContents,
        server_routes: ['/simulator', '/simulator/trade', '/simulator/portfolio', '/simulator/journal']
    });
});

// ISLAMIC PERSPECTIVES LESSONS (Numbered Series)
// ===========================================
// ISLAMIC PERSPECTIVES LESSONS
// ===========================================

// Direct routes for numbered files
app.get('/trading/learn/islamic-perspectives/01-riba-explained.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'trading', 'learn', 'islamic-perspectives', '01-riba-explained.html'));
});

app.get('/trading/learn/islamic-perspectives/02-gharar-in-trading.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'trading', 'learn', 'islamic-perspectives', '02-gharar-in-trading.html'));
});

app.get('/trading/learn/islamic-perspectives/03-haram-industries.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'trading', 'learn', 'islamic-perspectives', '03-haram-industries.html'));
});

app.get('/trading/learn/islamic-perspectives/04-asset-backed-trading.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'trading', 'learn', 'islamic-perspectives', '04-asset-backed-trading.html'));
});

// Redirects for unnumbered URLs (keep these after the main routes)
app.get('/trading/learn/islamic-perspectives/riba-explained.html', (req, res) => {
  res.redirect(301, '/trading/learn/islamic-perspectives/01-riba-explained.html');
});

app.get('/trading/learn/islamic-perspectives/gharar-in-trading.html', (req, res) => {
  res.redirect(301, '/trading/learn/islamic-perspectives/02-gharar-in-trading.html');
});

app.get('/trading/learn/islamic-perspectives/haram-industries.html', (req, res) => {
  res.redirect(301, '/trading/learn/islamic-perspectives/03-haram-industries.html');
});

app.get('/trading/learn/islamic-perspectives/asset-backed-trading.html', (req, res) => {
  res.redirect(301, '/trading/learn/islamic-perspectives/04-asset-backed-trading.html');
});

app.get('/trading/learn/islamic-perspectives/halal-stocks.html', (req, res) => {
  res.redirect(301, '/trading/learn/islamic-perspectives/01-riba-explained.html');
});

// Serve simulator pages
app.get('/simulator', (req, res) => {
    res.sendFile(path.join(__dirname, 'trading/simulator/index.html'));
});

app.get('/simulator/:page', (req, res) => {
    const page = req.params.page;
    const validPages = ['trade', 'portfolio', 'journal'];
    
    if (validPages.includes(page)) {
        res.sendFile(path.join(__dirname, `trading/simulator/${page}.html`));
    } else {
        res.status(404).send('Simulator page not found');
    }
});

// API endpoints for simulator
app.get('/api/stock/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        // You'll need to add your Alpha Vantage API key
        const API_KEY = 'YOUR_ALPHA_VANTAGE_KEY';
        const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/company/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        // Financial Modeling Prep API for fundamentals
        const API_KEY = 'YOUR_FMP_KEY';
        const response = await fetch(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${API_KEY}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== TRACKING API (ADD THIS SECTION) ==========
// Store tracking data in memory (or use a database in production)
let trackingStats = {
    users: [],
    trades: [],
    pageViews: {},
    dailyActive: {},
    lastReset: new Date().toDateString()
};

// Track user signup
app.post('/api/track-user', express.json(), (req, res) => {
    try {
        const userData = req.body;
        
        // Add timestamp
        const user = {
            ...userData,
            serverTimestamp: new Date().toISOString(),
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        };
        
        // Store in memory
        trackingStats.users.push(user);
        
        // Keep only last 1000 users in memory
        if (trackingStats.users.length > 1000) {
            trackingStats.users = trackingStats.users.slice(-1000);
        }
        
        // Update daily active
        const today = new Date().toDateString();
        trackingStats.dailyActive[today] = (trackingStats.dailyActive[today] || 0) + 1;
        
        console.log(`📊 New user tracked: ${userData.username || 'anonymous'}`);
        res.json({ success: true, message: 'User tracked' });
        
        // Optional: Save to file for persistence
        saveTrackingToFile();
        
    } catch (error) {
        console.error('Error tracking user:', error);
        res.status(500).json({ error: 'Tracking failed' });
    }
});

// Track trade
app.post('/api/track-trade', express.json(), (req, res) => {
    try {
        const tradeData = req.body;
        
        // Add metadata
        const trade = {
            ...tradeData,
            serverTimestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.headers['user-agent']
        };
        
        trackingStats.trades.push(trade);
        
        // Keep only last 5000 trades
        if (trackingStats.trades.length > 5000) {
            trackingStats.trades = trackingStats.trades.slice(-5000);
        }
        
        console.log(`📈 Trade tracked: ${tradeData.symbol} ${tradeData.type}`);
        res.json({ success: true });
        
        saveTrackingToFile();
        
    } catch (error) {
        console.error('Error tracking trade:', error);
        res.status(500).json({ error: 'Tracking failed' });
    }
});

// Track page view
app.post('/api/track-pageview', express.json(), (req, res) => {
    try {
        const { page, referrer } = req.body;
        
        if (!trackingStats.pageViews[page]) {
            trackingStats.pageViews[page] = 0;
        }
        trackingStats.pageViews[page]++;
        
        res.json({ success: true });
        
    } catch (error) {
        res.status(500).json({ error: 'Tracking failed' });
    }
});

// ========== ECONOMICS ROUTES ==========
// Economics Hub
app.get('/economics', (req, res) => {
    res.sendFile(path.join(__dirname, 'economics', 'index.html'));
});

// Economics Learning Center
app.get('/economics/learn', (req, res) => {
    res.sendFile(path.join(__dirname, 'economics', 'learn', 'index.html'));
});

// Economics Beginner Lessons
app.get('/economics/learn/beginner/:lesson', (req, res) => {
    const lesson = req.params.lesson;
    res.sendFile(path.join(__dirname, 'economics', 'learn', 'beginner', lesson));
});

// 🔴 ADD THIS SECTION - Economics Intermediate Lessons
app.get('/economics/learn/intermediate/:lesson', (req, res) => {
    const lesson = req.params.lesson;
    res.sendFile(path.join(__dirname, 'economics', 'learn', 'intermediate', lesson));
});

// Economics Advanced Lessons (for future)
app.get('/economics/learn/advanced/:lesson', (req, res) => {
    const lesson = req.params.lesson;
    res.sendFile(path.join(__dirname, 'economics', 'learn', 'advanced', lesson));
});

// Economics Quizzes
app.get('/economics/quizzes/:quiz', (req, res) => {
    const quiz = req.params.quiz;
    res.sendFile(path.join(__dirname, 'economics', 'quizzes', quiz));
});

// Economics References
app.get('/economics/references/:file', (req, res) => {
    const file = req.params.file;
    res.sendFile(path.join(__dirname, 'economics', 'references', file));
});


// Admin API - Get stats (protected)
app.get('/api/admin/stats', (req, res) => {
    // Simple auth check - you can make this more secure
    const authToken = req.headers['authorization'];
    
    // Change this to your secret token
    const validToken = 'Bearer fatimah-admin-2026';
    
    if (authToken !== validToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Calculate additional metrics
    const today = new Date().toDateString();
    const activeToday = trackingStats.dailyActive[today] || 0;
    
    // Calculate total trade volume
    const totalVolume = trackingStats.trades.reduce((sum, t) => sum + (t.total || 0), 0);
    
    // Get recent users (last 10)
    const recentUsers = trackingStats.users.slice(-10).map(u => ({
        username: u.username,
        email: u.email,
        signupDate: u.signupDate || u.serverTimestamp,
        lastActive: u.lastActive,
        trades: u.trades || 0
    }));
    
    // Get recent trades (last 20)
    const recentTrades = trackingStats.trades.slice(-20).map(t => ({
        symbol: t.symbol,
        type: t.type,
        quantity: t.quantity,
        price: t.price,
        total: t.total,
        timestamp: t.timestamp || t.serverTimestamp
    }));
    
    res.json({
        success: true,
        stats: {
            totalUsers: trackingStats.users.length,
            activeToday: activeToday,
            totalTrades: trackingStats.trades.length,
            totalVolume: totalVolume,
            pageViews: trackingStats.pageViews,
            recentUsers: recentUsers,
            recentTrades: recentTrades
        }
    });
});

// Optional: Save to file for persistence
function saveTrackingToFile() {
    try {
        const fs = require('fs');
        const path = require('path');
        
        const dataPath = path.join(__dirname, 'data', 'tracking-stats.json');
        
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        
        // Save only last 100 entries for efficiency
        const saveData = {
            users: trackingStats.users.slice(-100),
            trades: trackingStats.trades.slice(-200),
            pageViews: trackingStats.pageViews,
            dailyActive: trackingStats.dailyActive,
            lastSaved: new Date().toISOString()
        };
        
        fs.writeFileSync(dataPath, JSON.stringify(saveData, null, 2));
        
    } catch (error) {
        // Silent fail - don't let file errors affect the app
        console.error('Error saving tracking data:', error.message);
    }
}

// Load saved data on startup
function loadTrackingFromFile() {
    try {
        const fs = require('fs');
        const path = require('path');
        const dataPath = path.join(__dirname, 'data', 'tracking-stats.json');
        
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            trackingStats.users = data.users || [];
            trackingStats.trades = data.trades || [];
            trackingStats.pageViews = data.pageViews || {};
            trackingStats.dailyActive = data.dailyActive || {};
            console.log('📊 Loaded tracking data from file');
        }
    } catch (error) {
        console.error('Error loading tracking data:', error.message);
    }
}

// Call this when server starts
loadTrackingFromFile();

// Reset daily stats at midnight
setInterval(() => {
    const today = new Date().toDateString();
    if (trackingStats.lastReset !== today) {
        // Reset daily active count for new day
        trackingStats.dailyActive[today] = 0;
        trackingStats.lastReset = today;
        console.log('📊 Daily stats reset for new day');
    }
}, 60000); // Check every minute

// ========== END TRACKING API ==========

// Save user portfolio (temporary - will need database later)
app.post('/api/portfolio/save', express.json(), (req, res) => {
    // For now, just acknowledge - Phase 2 will have database
    res.json({ success: true, message: 'Portfolio saved' });
});

// Serve simulator pages - add console logs
app.get('/simulator', (req, res) => {
    console.log('📊 SIMULATOR ROUTE HIT: /simulator');
    const filePath = path.join(__dirname, 'trading/simulator/index.html');
    console.log('📁 Attempting to serve:', filePath);
    
    // Check if file exists
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
        console.log('✅ File exists, sending...');
        res.sendFile(filePath);
    } else {
        console.log('❌ File does not exist!');
        res.status(404).send('File not found');
    }
});

app.get('/simulator/:page', (req, res) => {
    console.log(`📊 SIMULATOR ROUTE HIT: /simulator/${req.params.page}`);
    const page = req.params.page;
    const validPages = ['trade', 'portfolio', 'journal'];
    
    if (validPages.includes(page)) {
        const filePath = path.join(__dirname, `trading/simulator/${page}.html`);
        console.log('📁 Attempting to serve:', filePath);
        
        const fs = require('fs');
        if (fs.existsSync(filePath)) {
            console.log('✅ File exists, sending...');
            res.sendFile(filePath);
        } else {
            console.log('❌ File does not exist!');
            res.status(404).send('File not found');
        }
    } else {
        console.log('❌ Invalid page requested:', page);
        res.status(404).send('Simulator page not found');
    }
});

// Economics Education
app.get('/economics', (req, res) => {
  res.sendFile(path.join(__dirname, 'economics', 'index.html'));
});

// Educational Resources
app.get('/resources', (req, res) => {
  res.sendFile(path.join(__dirname, 'resources', 'index.html'));
});

// API Routes
app.get('/api/market-data', async (req, res) => {
  // Simulate market data
  const marketData = {
    timestamp: new Date(),
    indices: [
      { symbol: '^GSPC', name: 'S&P 500', price: 4780.45, change: 12.34, changePercent: 0.26 },
      { symbol: '^DJI', name: 'Dow Jones', price: 37592.98, change: 45.67, changePercent: 0.12 },
      { symbol: '^IXIC', name: 'NASDAQ', price: 14972.76, change: 78.90, changePercent: 0.53 }
    ],
    topGainers: [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 192.53, change: 3.45, changePercent: 1.82 },
      { symbol: 'MSFT', name: 'Microsoft', price: 374.58, change: 5.67, changePercent: 1.54 }
    ],
    topLosers: [
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 237.49, change: -4.32, changePercent: -1.79 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 488.90, change: -3.21, changePercent: -0.65 }
    ]
  };
  res.json(marketData);
});

app.get('/api/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      username: user.username,
      portfolioValue: user.portfolioValue,
      virtualCash: user.virtualCash,
      totalTrades: user.totalTrades,
      winningTrades: user.winningTrades,
      winRate: user.totalTrades > 0 ? (user.winningTrades / user.totalTrades * 100).toFixed(2) : 0,
      totalProfit: user.totalProfit,
      watchlist: user.watchlist,
      holdings: user.holdings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ========== COMMODITY PRICES API ==========
// Fetch commodity prices from reliable sources
app.get('/api/commodity-prices', async (req, res) => {
    try {
        let prices = {
            gold: null, silver: null, oil: null, brent: null, natgas: null
        };
        
        // Use Yahoo Finance for all commodities (reliable, no API key needed)
        try {
            const symbols = {
                gold: 'GC=F',      // Gold Futures
                silver: 'SI=F',    // Silver Futures
                oil: 'CL=F',       // WTI Crude Oil
                brent: 'BZ=F',     // Brent Crude Oil
                natgas: 'NG=F'     // Natural Gas
            };
            
            for (const [key, symbol] of Object.entries(symbols)) {
                const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
                if (response.ok) {
                    const data = await response.json();
                    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
                    if (price) prices[key] = price;
                }
            }
        } catch (e) {
            console.log('Yahoo Finance fetch error:', e.message);
        }
        
        // Fallback to realistic current values (as of March 2026)
        const fallbackPrices = {
            gold: 4565.50,
            silver: 71.13,
            oil: 82.34,
            brent: 86.12,
            natgas: 2.85
        };
        
        res.json({
            success: true,
            gold: { price: prices.gold || fallbackPrices.gold, change: 0, changePercent: 0 },
            silver: { price: prices.silver || fallbackPrices.silver, change: 0, changePercent: 0 },
            oil: { price: prices.oil || fallbackPrices.oil, change: 0, changePercent: 0 },
            brent: { price: prices.brent || fallbackPrices.brent, change: 0, changePercent: 0 },
            natgas: { price: prices.natgas || fallbackPrices.natgas, change: 0, changePercent: 0 },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Commodity API error:', error);
        // Return fallback prices on error
        res.json({
            success: false,
            gold: { price: 4565.50, change: 0, changePercent: 0 },
            silver: { price: 71.13, change: 0, changePercent: 0 },
            oil: { price: 82.34, change: 0, changePercent: 0 },
            brent: { price: 86.12, change: 0, changePercent: 0 },
            natgas: { price: 2.85, change: 0, changePercent: 0 }
        });
    }
});

// ========== CONTACT FORM API (MONGODB STORAGE) ==========
const ContactMessage = require('./models/ContactMessage');

// Submit contact form
app.post('/api/contact', express.json(), async (req, res) => {
    try {
        const { name, email, subject, message, copyToSelf, subscribeUpdates } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }
        
        const newMessage = new ContactMessage({
            name,
            email,
            subject: subject || 'General Inquiry',
            message,
            copyToSelf: copyToSelf || false,
            subscribeUpdates: subscribeUpdates || false,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });
        
        const savedMessage = await newMessage.save();
        console.log(`📬 New message saved to MongoDB from ${name} (${email}) - ID: ${savedMessage._id}`);
        res.json({ success: true, id: savedMessage._id });
        
    } catch (error) {
        console.error('❌ Error saving message to MongoDB:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get all messages (admin only)
app.get('/api/contact/messages', async (req, res) => {
    const authToken = req.headers['authorization'];
    if (authToken !== 'Bearer fatimah-admin-2026') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });
        console.log(`📋 Fetched ${messages.length} messages from MongoDB`);
        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Mark message as read
app.put('/api/contact/messages/:id/read', async (req, res) => {
    const authToken = req.headers['authorization'];
    if (authToken !== 'Bearer fatimah-admin-2026') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const message = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        
        if (message) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Message not found' });
        }
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ error: 'Failed to update message' });
    }
});

// Delete message
app.delete('/api/contact/messages/:id', async (req, res) => {
    const authToken = req.headers['authorization'];
    if (authToken !== 'Bearer fatimah-admin-2026') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const result = await ContactMessage.findByIdAndDelete(req.params.id);
        
        if (result) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Message not found' });
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});


// ========== ERROR HANDLING ==========
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>404 - Financial Hub</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-align: center;
        }
        .error-container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 3rem;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { font-size: 4rem; margin: 0; }
        p { font-size: 1.2rem; opacity: 0.9; }
        a { 
          color: #fff; 
          text-decoration: none;
          background: rgba(255,255,255,0.2);
          padding: 10px 25px;
          border-radius: 50px;
          display: inline-block;
          margin-top: 20px;
          transition: all 0.3s;
        }
        a:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
      </style>
    </head>
    <body>
      <div class="error-container">
        <h1>404</h1>
        <p>Financial page not found. Market closed? 📉</p>
        <a href="/">← Back to Trading Floor</a>
      </div>
    </body>
    </html>
  `);
});

// ========== START SERVER ==========
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 FATIMAH FINANCIAL HUB - Trading Platform');
  console.log('='.repeat(60));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/`);
  console.log(`📞 Telephony: http://localhost:${PORT}/telephony`);
  console.log(`💰 Trading: http://localhost:${PORT}/trading`);
  console.log(`📈 Finance Tools: http://localhost:${PORT}/finance-tools`);
  console.log(`🎓 Economics: http://localhost:${PORT}/economics`);
  console.log('='.repeat(60));
  console.log('⚡ Ready for trading! Connect your algorithms...');
  console.log('💡 Tip: Open multiple browser tabs to simulate different traders');
});
