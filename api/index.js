require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('../routes/auth');
const chatRoutes = require('../routes/chat');
const uploadRoutes = require('../routes/upload');

const Message = require('../models/Message');

const authenticateToken = require('../middleware/auth');
const socketAuth = require('../middleware/socketAuth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          process.env.FRONTEND_URL, 
          /^https:\/\/.*\.vercel\.app$/,
          "https://chatflow-dev.vercel.app"
        ].filter(Boolean)
      : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(helmet({
  contentSecurityPolicy: false,
}));

const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL, 
        /^https:\/\/.*\.vercel\.app$/,
        "https://chatflow-dev.vercel.app"
      ].filter(Boolean)
    : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
} else {
  app.use(express.static(path.join(__dirname, '../public')));
}
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);

app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  } else {
    res.redirect('http://127.0.0.1:5173');
  }
});

const connectedUsers = new Map();
const userRooms = new Map();

io.use(socketAuth);

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  
  connectedUsers.set(socket.userId, {
    socketId: socket.id,
    username: socket.username,
    lastSeen: new Date()
  });

  socket.broadcast.emit('user_online', {
    userId: socket.userId,
    username: socket.username
  });

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    
    if (!userRooms.has(socket.userId)) {
      userRooms.set(socket.userId, new Set());
    }
    userRooms.get(socket.userId).add(roomId);
    
    socket.to(roomId).emit('user_joined_room', {
      userId: socket.userId,
      username: socket.username,
      roomId
    });
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    
    if (userRooms.has(socket.userId)) {
      userRooms.get(socket.userId).delete(roomId);
    }
    
    socket.to(roomId).emit('user_left_room', {
      userId: socket.userId,
      username: socket.username,
      roomId
    });
  });

  socket.on('room_message', async (data) => {
    try {
      const { roomId, message, messageType = 'text' } = data;
      
      const newMessage = new Message({
        sender: socket.userId,
        room: roomId,
        content: { text: message },
        messageType
      });
      
      const savedMessage = await newMessage.save();
      await savedMessage.populate('sender', 'username avatar');
      
      const messageData = {
        senderId: socket.userId,
        senderUsername: socket.username,
        roomId,
        message,
        messageType,
        timestamp: savedMessage.createdAt,
        _id: savedMessage._id
      };

      io.to(roomId).emit('room_message', messageData);
    } catch (error) {
      console.error('Error saving room message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('private_message', async (data) => {
    try {
      const { recipientId, message, messageType = 'text' } = data;
      
      const newMessage = new Message({
        sender: socket.userId,
        recipient: recipientId,
        content: { text: message },
        messageType,
        isPrivate: true
      });
      
      const savedMessage = await newMessage.save();
      await savedMessage.populate('sender', 'username avatar');
      
      const messageData = {
        senderId: socket.userId,
        senderUsername: socket.username,
        recipientId,
        message,
        messageType,
        timestamp: savedMessage.createdAt,
        isPrivate: true,
        _id: savedMessage._id
      };

      const recipient = connectedUsers.get(recipientId);
      if (recipient) {
        io.to(recipient.socketId).emit('private_message', messageData);
      }
      
      socket.emit('private_message', messageData);
    } catch (error) {
      console.error('Error saving private message:', error);
      socket.emit('error', { message: 'Failed to send private message' });
    }
  });

  socket.on('typing_start', (data) => {
    if (data.roomId) {
      socket.to(data.roomId).emit('user_typing', {
        userId: socket.userId,
        username: socket.username,
        roomId: data.roomId
      });
    }
  });

  socket.on('typing_stop', (data) => {
    if (data.roomId) {
      socket.to(data.roomId).emit('user_stop_typing', {
        userId: socket.userId,
        username: socket.username,
        roomId: data.roomId
      });
    }
  });

  socket.on('get_online_users', () => {
    const onlineUsers = Array.from(connectedUsers.entries()).map(([userId, userData]) => ({
      userId,
      username: userData.username,
      lastSeen: userData.lastSeen
    }));
    socket.emit('online_users', onlineUsers);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
    
    if (connectedUsers.has(socket.userId)) {
      connectedUsers.delete(socket.userId);
    }
    
    if (userRooms.has(socket.userId)) {
      userRooms.delete(socket.userId);
    }
    
    socket.broadcast.emit('user_offline', {
      userId: socket.userId,
      username: socket.username
    });
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

// For Vercel deployment, export the app instead of starting the server
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  module.exports = app;
} else {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
  module.exports = { app, server, io };
}
