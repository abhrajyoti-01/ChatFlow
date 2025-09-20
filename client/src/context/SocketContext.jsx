import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';
import apiService from '../services/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map()); // roomId -> Set of usernames
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState(new Map()); // roomId/userId -> count
  const [rooms, setRooms] = useState([]);
  const [directChats] = useState([]);
  const [conversations, setConversations] = useState([]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Connect/disconnect socket based on authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      if (token) {
        const socketInstance = socketService.connect(token);
        setSocket(socketInstance);

        // Set up event listeners
        socketInstance.on('connect', () => {
          console.log('✅ Socket connected successfully');
          setIsConnected(true);
          setConnectionError(null);
          setIsRetrying(false);
          socketService.getOnlineUsers();
        });

        socketInstance.on('disconnect', (reason) => {
          console.log('⚠️ Socket disconnected:', reason);
          setIsConnected(false);
          if (reason === 'io server disconnect') {
            // Server terminated the connection, try to reconnect
            setIsRetrying(true);
          }
        });

        socketInstance.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error.message);
          setIsConnected(false);
          setConnectionError(`Connection failed: ${error.message}`);
          
          // Set retry state for UI feedback
          if (error.message.includes('ECONNREFUSED')) {
            setConnectionError('Server is not available. Retrying...');
            setIsRetrying(true);
          }
        });

        socketInstance.on('reconnect', (attemptNumber) => {
          console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
          setConnectionError(null);
          setIsRetrying(false);
        });

        socketInstance.on('reconnect_attempt', (attemptNumber) => {
          console.log('🔄 Attempting to reconnect...', attemptNumber);
          setIsRetrying(true);
          setConnectionError(`Reconnecting... (attempt ${attemptNumber})`);
        });

        socketInstance.on('reconnect_failed', () => {
          console.error('❌ Failed to reconnect after maximum attempts');
          setConnectionError('Failed to connect to server. Please refresh the page.');
          setIsRetrying(false);
        });

        // Online users management
        socketService.onOnlineUsers((users) => {
          setOnlineUsers(users.filter(u => u.userId !== user._id)); // Exclude current user
        });

        socketService.onUserOnline((userData) => {
          if (userData.userId !== user._id) {
            setOnlineUsers(prev => {
              const filtered = prev.filter(u => u.userId !== userData.userId);
              return [...filtered, userData];
            });
          }
        });

        socketService.onUserOffline((userData) => {
          setOnlineUsers(prev => prev.filter(u => u.userId !== userData.userId));
        });

        // Typing indicators
        socketService.onUserTyping((data) => {
          if (data.userId !== user._id) {
            setTypingUsers(prev => {
              const newMap = new Map(prev);
              if (!newMap.has(data.roomId)) {
                newMap.set(data.roomId, new Set());
              }
              newMap.get(data.roomId).add(data.username);
              return newMap;
            });
          }
        });

        socketService.onUserStopTyping((data) => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            if (newMap.has(data.roomId)) {
              newMap.get(data.roomId).delete(data.username);
              if (newMap.get(data.roomId).size === 0) {
                newMap.delete(data.roomId);
              }
            }
            return newMap;
          });
        });

        // Notification handling for new messages
        socketService.onRoomMessage((messageData) => {
          if (messageData.senderId !== user._id) {
            showNotification(`New message in ${messageData.roomName || 'Room'}`, messageData.message);
            
            // Update unread count
            setUnreadCounts(prev => {
              const newMap = new Map(prev);
              const current = newMap.get(messageData.roomId) || 0;
              newMap.set(messageData.roomId, current + 1);
              return newMap;
            });
          }
        });

        socketService.onPrivateMessage((messageData) => {
          if (messageData.senderId !== user._id) {
            showNotification(`New message from ${messageData.senderUsername}`, messageData.message);
            
            // Update unread count
            setUnreadCounts(prev => {
              const newMap = new Map(prev);
              const current = newMap.get(messageData.senderId) || 0;
              newMap.set(messageData.senderId, current + 1);
              return newMap;
            });
          }
        });

        return () => {
          socketService.disconnect();
          setSocket(null);
          setIsConnected(false);
          setConnectionError(null);
          setIsRetrying(false);
          setOnlineUsers([]);
          setTypingUsers(new Map());
          setNotifications([]);
          setUnreadCounts(new Map());
        };
      }
    } else {
      socketService.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      setIsRetrying(false);
      setOnlineUsers([]);
      setTypingUsers(new Map());
      setNotifications([]);
      setUnreadCounts(new Map());
    }
  }, [isAuthenticated, user]);

  // Fetch rooms and conversations when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchRooms();
      fetchConversations();
    } else {
      setRooms([]);
      setConversations([]);
    }
  }, [isAuthenticated, user]);

  // Auto-clear typing indicators after timeout
  useEffect(() => {
    const intervals = new Map();

    typingUsers.forEach((users, roomId) => {
      if (users.size > 0 && !intervals.has(roomId)) {
        const interval = setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(roomId);
            return newMap;
          });
        }, 3000); // Clear after 3 seconds of inactivity
        intervals.set(roomId, interval);
      }
    });

    return () => {
      intervals.forEach(interval => clearTimeout(interval));
    };
  }, [typingUsers]);

  // Notification helper function
  const showNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: body.length > 50 ? body.substring(0, 50) + '...' : body,
        icon: '/favicon.ico',
        tag: 'chat-notification'
      });
    }
    
    // Add to internal notifications list
    const notification = {
      id: Date.now(),
      title,
      body,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep only 10 recent notifications
  };

  // Clear unread count for a room/chat
  const clearUnreadCount = (id) => {
    setUnreadCounts(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  // Socket methods
  const joinRoom = (roomId) => {
    socketService.joinRoom(roomId);
  };

  const leaveRoom = (roomId) => {
    socketService.leaveRoom(roomId);
  };

  const sendRoomMessage = (roomId, message, messageType = 'text') => {
    socketService.sendRoomMessage(roomId, message, messageType);
  };

  const sendPrivateMessage = (recipientId, message, messageType = 'text') => {
    socketService.sendPrivateMessage(recipientId, message, messageType);
  };

  const startTyping = (roomId) => {
    socketService.startTyping(roomId);
  };

  const stopTyping = (roomId) => {
    socketService.stopTyping(roomId);
  };

  // Event subscription methods
  const onRoomMessage = (callback) => {
    socketService.onRoomMessage(callback);
    return () => socketService.off('room_message', callback);
  };

  const onPrivateMessage = (callback) => {
    socketService.onPrivateMessage(callback);
    return () => socketService.off('private_message', callback);
  };

  const onUserJoinedRoom = (callback) => {
    socketService.onUserJoinedRoom(callback);
    return () => socketService.off('user_joined_room', callback);
  };

  const onUserLeftRoom = (callback) => {
    socketService.onUserLeftRoom(callback);
    return () => socketService.off('user_left_room', callback);
  };

  const onError = (callback) => {
    socketService.onError(callback);
    return () => socketService.off('error', callback);
  };

  const getTypingUsersForRoom = (roomId) => {
    const users = typingUsers.get(roomId);
    return users ? Array.from(users) : [];
  };

  const createRoom = async (roomData) => {
    try {
      const response = await apiService.createRoom(roomData);
      // Add the new room to local state
      setRooms(prev => [...prev, response.room]);
      return response.room;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await apiService.getRooms();
      setRooms(response.rooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await apiService.getConversations();
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    isRetrying,
    onlineUsers,
    notifications,
    unreadCounts,
    rooms,
    directChats,
    conversations,
    joinRoom,
    leaveRoom,
    sendRoomMessage,
    sendPrivateMessage,
    startTyping,
    stopTyping,
    onRoomMessage,
    onPrivateMessage,
    onUserJoinedRoom,
    onUserLeftRoom,
    onError,
    getTypingUsersForRoom,
    clearUnreadCount,
    createRoom,
    fetchRooms,
    fetchConversations
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
