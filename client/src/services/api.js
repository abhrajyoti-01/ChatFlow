// API Service for authentication and chat functionality
const API_BASE_URL = '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  // Set authorization header
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Set token
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Remove token
  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Generic API call method
  async apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle network errors
      if (!response) {
        throw new Error('Network error: Unable to connect to server');
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        if (response.status >= 200 && response.status < 300) {
          return { success: true };
        }
        throw new Error('Server error: Invalid response format');
      }

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          this.removeToken();
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied.');
        } else if (response.status === 404) {
          throw new Error('Resource not found.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        throw new Error(data.message || `HTTP error ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle network connection errors
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    const response = await this.apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async login(credentials) {
    const response = await this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.apiCall('/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.removeToken();
    }
  }

  async getProfile() {
    return this.apiCall('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData) {
    return this.apiCall('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async searchUsers(query) {
    return this.apiCall(`/auth/users/search?q=${encodeURIComponent(query)}`);
  }

  async searchRooms(query) {
    return this.apiCall(`/chat/rooms/search?q=${encodeURIComponent(query)}`);
  }

  // Chat methods
  async getRooms() {
    return this.apiCall('/chat/rooms');
  }

  async createRoom(roomData) {
    return this.apiCall('/chat/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async joinRoom(roomId) {
    return this.apiCall(`/chat/rooms/${roomId}/join`, {
      method: 'POST',
    });
  }

  async leaveRoom(roomId) {
    return this.apiCall(`/chat/rooms/${roomId}/leave`, {
      method: 'POST',
    });
  }

  async getRoomMessages(roomId, page = 1, limit = 50) {
    return this.apiCall(`/chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`);
  }

  async sendRoomMessage(roomId, messageData) {
    return this.apiCall(`/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getConversations() {
    return this.apiCall('/chat/conversations');
  }

  async getPrivateMessages(userId, page = 1, limit = 50) {
    return this.apiCall(`/chat/conversations/${userId}/messages?page=${page}&limit=${limit}`);
  }

  async sendPrivateMessage(userId, messageData) {
    return this.apiCall(`/chat/conversations/${userId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async addReaction(messageId, emoji) {
    return this.apiCall(`/chat/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  async removeReaction(messageId, emoji) {
    return this.apiCall(`/chat/messages/${messageId}/reactions/${emoji}`, {
      method: 'DELETE',
    });
  }

  async editMessage(messageId, content) {
    return this.apiCall(`/chat/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteMessage(messageId) {
    return this.apiCall(`/chat/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  // File upload methods
  async uploadFile(file, roomId = null, recipientId = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (roomId) {
      formData.append('roomId', roomId);
    }
    
    if (recipientId) {
      formData.append('recipientId', recipientId);
    }

    const response = await fetch('/api/upload/file', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'File upload failed');
    }

    return response.json();
  }

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch('/api/upload/avatar', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Avatar upload failed');
    }

    return response.json();
  }

  // Verify token
  async verifyToken() {
    try {
      return await this.apiCall('/auth/verify');
    } catch (error) {
      this.removeToken();
      throw error;
    }
  }
}

export default new ApiService();