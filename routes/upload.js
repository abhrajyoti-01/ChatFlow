const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Message = require('../models/Message');
const Room = require('../models/Room');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES ? 
    process.env.ALLOWED_FILE_TYPES.split(',') : 
    ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB default
    files: 1
  }
});

// Upload file and send as message
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    const { roomId, recipientId, messageType = 'file' } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate either roomId or recipientId is provided
    if (!roomId && !recipientId) {
      return res.status(400).json({ 
        message: 'Either roomId or recipientId must be provided' 
      });
    }

    if (roomId && recipientId) {
      return res.status(400).json({ 
        message: 'Cannot specify both roomId and recipientId' 
      });
    }

    // If it's a room message, verify user is a member
    if (roomId) {
      const room = await Room.findById(roomId);
      if (!room || !room.isActive) {
        return res.status(404).json({ message: 'Room not found' });
      }
      if (!room.isMember(req.user._id)) {
        return res.status(403).json({ 
          message: 'Access denied. Not a member of this room.' 
        });
      }
      if (!room.settings.allowFileSharing) {
        return res.status(403).json({ 
          message: 'File sharing is disabled in this room' 
        });
      }
    }

    // Create file URL
    const fileUrl = `/uploads/${req.file.filename}`;

    // Determine message type based on file type
    let actualMessageType = messageType;
    if (req.file.mimetype.startsWith('image/')) {
      actualMessageType = 'image';
    } else {
      actualMessageType = 'file';
    }

    // Create message with file content
    const messageData = {
      sender: req.user._id,
      content: {
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: fileUrl
        }
      },
      messageType: actualMessageType,
      isPrivate: !roomId
    };

    if (roomId) {
      messageData.room = roomId;
    } else {
      messageData.recipient = recipientId;
    }

    const message = new Message(messageData);
    await message.save();
    await message.populate('sender', 'username avatar');

    // Update room activity if it's a room message
    if (roomId) {
      const room = await Room.findById(roomId);
      await room.updateActivity();
    }

    res.status(201).json({
      message: 'File uploaded and message sent successfully',
      data: message,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'File too large. Maximum size is 10MB.' 
      });
    }
    
    if (error.message.includes('File type')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Server error uploading file' });
  }
});

// Upload avatar
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No avatar file uploaded' });
    }

    // Only allow image files for avatars
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ 
        message: 'Avatar must be an image file' 
      });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    // Update user avatar
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = avatarUrl;
    await user.save();

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'Avatar file too large. Maximum size is 10MB.' 
      });
    }
    
    res.status(500).json({ message: 'Server error uploading avatar' });
  }
});

// Get file info
router.get('/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Find message with this file
    const message = await Message.findOne({
      'content.file.filename': filename,
      isDeleted: false
    }).populate('sender', 'username');

    if (!message) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to this file
    let hasAccess = false;

    if (message.isPrivate) {
      // Private message - check if user is sender or recipient
      hasAccess = message.sender._id.toString() === req.user._id.toString() ||
                  (message.recipient && message.recipient.toString() === req.user._id.toString());
    } else if (message.room) {
      // Room message - check if user is member of the room
      const room = await Room.findById(message.room);
      hasAccess = room && room.isMember(req.user._id);
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      file: message.content.file,
      sender: message.sender.username,
      uploadedAt: message.createdAt
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({ message: 'Server error getting file info' });
  }
});

// Delete file
router.delete('/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Find message with this file
    const message = await Message.findOne({
      'content.file.filename': filename,
      isDeleted: false
    });

    if (!message) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user can delete this file (only sender can delete)
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. Only the sender can delete this file.' 
      });
    }

    // Soft delete the message (which contains the file)
    message.softDelete();
    await message.save();

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Server error deleting file' });
  }
});

// Error handling middleware specific to upload routes
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'File too large. Maximum size is 10MB.' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: 'Too many files. Only one file allowed per upload.' 
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Unexpected field name for file upload.' 
      });
    }
  }
  
  if (error.message.includes('File type')) {
    return res.status(400).json({ message: error.message });
  }
  
  res.status(500).json({ message: 'File upload error' });
});

module.exports = router;
