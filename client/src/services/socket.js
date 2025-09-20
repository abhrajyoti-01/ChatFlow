import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    // Use proxy path for development, and support production environment
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : window.location.origin.replace(':5173', ':3000');

    this.socket = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Room methods
  joinRoom(roomId) {
    this.emit('join_room', roomId);
  }

  leaveRoom(roomId) {
    this.emit('leave_room', roomId);
  }

  sendRoomMessage(roomId, message, messageType = 'text') {
    this.emit('room_message', {
      roomId,
      message,
      messageType
    });
  }

  sendPrivateMessage(recipientId, message, messageType = 'text') {
    this.emit('private_message', {
      recipientId,
      message,
      messageType
    });
  }

  // Typing indicators
  startTyping(roomId) {
    this.emit('typing_start', { roomId });
  }

  stopTyping(roomId) {
    this.emit('typing_stop', { roomId });
  }

  // Online users
  getOnlineUsers() {
    this.emit('get_online_users');
  }

  onRoomMessage(callback) {
    this.on('room_message', callback);
  }

  onPrivateMessage(callback) {
    this.on('private_message', callback);
  }

  onUserOnline(callback) {
    this.on('user_online', callback);
  }

  onUserOffline(callback) {
    this.on('user_offline', callback);
  }

  onUserJoinedRoom(callback) {
    this.on('user_joined_room', callback);
  }

  onUserLeftRoom(callback) {
    this.on('user_left_room', callback);
  }

  onUserTyping(callback) {
    this.on('user_typing', callback);
  }

  onUserStopTyping(callback) {
    this.on('user_stop_typing', callback);
  }

  onOnlineUsers(callback) {
    this.on('online_users', callback);
  }

  onError(callback) {
    this.on('error', callback);
  }
}

export default new SocketService();