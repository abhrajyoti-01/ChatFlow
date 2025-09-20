# RealTime Chat Application

A modern, full-featured real-time chat application built with React.js frontend and Node.js/Express backend, using WebSocket technology for instant messaging.

## 🚀 Features

### ✅ Completed Features
- **User Authentication**: Registration and login system with JWT tokens
- **Secure Backend**: Express.js server with security middleware
- **Database Models**: MongoDB models for users, rooms, and messages
- **React Frontend**: Modern React.js frontend with Vite build tool
- **Authentication UI**: Beautiful login/register interface
- **API Integration**: Complete REST API for all backend operations

### 🔄 Features In Development
- **Real-time Messaging**: WebSocket integration with Socket.IO
- **Chat Rooms**: Create and join public/private chat rooms
- **Private Messaging**: One-on-one conversations between users
- **Message History**: Persistent chat history with pagination
- **User Presence**: Online/offline status indicators
- **Notifications**: Real-time message notifications
- **File Sharing**: Upload and share images and documents

### 🎯 Optional Features (Future)
- **Message Reactions**: Emoji reactions to messages
- **Message Editing**: Edit and delete messages
- **Typing Indicators**: Show when users are typing
- **Message Search**: Search through chat history
- **Voice/Video Calls**: WebRTC integration
- **Theme Customization**: Dark/light mode toggle

## 🛠️ Tech Stack

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Frontend
- **React.js** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Socket.IO Client** - WebSocket client
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework for styling

## 📁 Project Structure

```
realtime-chat-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context providers
│   │   ├── services/       # API service layer
│   │   └── utils/          # Utility functions
│   ├── public/
│   └── package.json
├── models/                 # Database models
│   ├── User.js
│   ├── Room.js
│   └── Message.js
├── routes/                 # API routes
│   ├── auth.js
│   ├── chat.js
│   └── upload.js
├── middleware/             # Express middleware
│   ├── auth.js
│   └── socketAuth.js
├── uploads/                # File upload directory
├── server.js               # Main server file
├── package.json
└── .env                    # Environment variables
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realtime-chat-app
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/chatapp

   # JWT Configuration
   JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here
   JWT_EXPIRES_IN=7d

   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,text/plain,application/pdf
   ```

5. **Start MongoDB**
   
   **Option A: Local MongoDB**
   ```bash
   # Install MongoDB from https://www.mongodb.com/try/download/community
   # Start MongoDB service
   mongod
   ```
   
   **Option B: MongoDB Atlas (Cloud)**
   - Create account at https://cloud.mongodb.com
   - Create a cluster and get connection string
   - Update `MONGODB_URI` in `.env` file

### Running the Application

1. **Start the backend server**
   ```bash
   npm start
   # or for development with auto-restart
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 🔧 Development

### Available Scripts

**Backend (root directory):**
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

**Frontend (client directory):**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `GET /api/auth/users/search` - Search users

#### Chat
- `GET /api/chat/rooms` - Get user's rooms
- `POST /api/chat/rooms` - Create new room
- `POST /api/chat/rooms/:id/join` - Join room
- `POST /api/chat/rooms/:id/leave` - Leave room
- `GET /api/chat/rooms/:id/messages` - Get room messages
- `POST /api/chat/rooms/:id/messages` - Send room message
- `GET /api/chat/conversations` - Get private conversations
- `GET /api/chat/conversations/:userId/messages` - Get private messages
- `POST /api/chat/conversations/:userId/messages` - Send private message

#### File Upload
- `POST /api/upload/file` - Upload file with message
- `POST /api/upload/avatar` - Upload user avatar

### WebSocket Events

#### Client to Server
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `room_message` - Send message to room
- `private_message` - Send private message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `get_online_users` - Get list of online users

#### Server to Client
- `room_message` - Receive room message
- `private_message` - Receive private message
- `user_joined_room` - User joined room notification
- `user_left_room` - User left room notification
- `user_online` - User came online
- `user_offline` - User went offline
- `user_typing` - User is typing
- `user_stop_typing` - User stopped typing
- `online_users` - List of online users

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with salt rounds
- **CORS Protection** - Configured for development and production
- **Rate Limiting** - Protection against brute force attacks
- **Helmet.js** - Security headers middleware
- **Input Validation** - Server-side validation for all inputs
- **File Upload Security** - File type and size restrictions

## 🚀 Deployment

### Production Build

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Set environment variables**
   ```env
   NODE_ENV=production
   MONGODB_URI=your_production_mongodb_uri
   JWT_SECRET=your_production_jwt_secret
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

### Deployment Platforms

**Recommended platforms:**
- **Heroku** - Easy deployment with MongoDB Atlas
- **Vercel** - Great for frontend with serverless functions
- **Railway** - Modern deployment platform
- **DigitalOcean** - VPS deployment with Docker

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access for MongoDB Atlas

2. **Port Already in Use**
   ```bash
   # Kill process using port 3000
   npx kill-port 3000
   ```

3. **Dependencies Issues**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **CORS Errors**
   - Check frontend and backend URLs in configuration
   - Verify CORS settings in server.js

### Getting Help

- Open an issue on GitHub
- Check the documentation
- Review the console logs for error details

## 🔮 Future Enhancements

- Mobile app with React Native
- Desktop app with Electron
- Advanced moderation tools
- Integration with external APIs
- Performance optimizations
- Comprehensive testing suite

---

**Happy Chatting! 💬✨**