const express = require('express');
const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');

const router = express.Router();

// Get user's chat rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({
      'members.user': req.user._id,
      isActive: true
    })
    .populate('creator', 'username avatar')
    .populate('members.user', 'username avatar status')
    .sort({ lastActivity: -1 });

    res.json({ rooms });
  } catch (error) {
    console.error('Fetch rooms error:', error);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
});

// Search rooms
router.get('/rooms/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        message: 'Search query must be at least 2 characters' 
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const rooms = await Room.find({
      $and: [
        { isActive: true },
        { type: 'public' }, // Only search public rooms for now
        { name: searchRegex }
      ]
    })
    .populate('creator', 'username avatar')
    .populate('members.user', 'username avatar status')
    .select('name description type creator members createdAt lastActivity')
    .limit(parseInt(limit))
    .sort({ lastActivity: -1, createdAt: -1 });

    res.json({ rooms });
  } catch (error) {
    console.error('Room search error:', error);
    res.status(500).json({ message: 'Server error searching rooms' });
  }
});

// Create new room
router.post('/rooms', async (req, res) => {
  try {
    const { name, description, type = 'public' } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    if (name.length > 50) {
      return res.status(400).json({ message: 'Room name must be less than 50 characters' });
    }

    const room = new Room({
      name: name.trim(),
      description: description || '',
      type,
      creator: req.user._id,
      members: [{
        user: req.user._id,
        role: 'admin',
        joinedAt: new Date()
      }],
      admins: [req.user._id]
    });

    await room.save();
    await room.populate('creator', 'username avatar');
    await room.populate('members.user', 'username avatar status');

    res.status(201).json({
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ message: 'Server error creating room' });
  }
});

// Join room
router.post('/rooms/:roomId/join', async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room || !room.isActive) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.isMember(req.user._id)) {
      return res.status(409).json({ message: 'Already a member of this room' });
    }

    if (room.members.length >= room.maxMembers) {
      return res.status(409).json({ message: 'Room is full' });
    }

    const added = room.addMember(req.user._id);
    if (!added) {
      return res.status(409).json({ message: 'Failed to join room' });
    }

    await room.save();
    await room.populate('members.user', 'username avatar status');

    res.json({
      message: 'Joined room successfully',
      room
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Server error joining room' });
  }
});

// Leave room
router.post('/rooms/:roomId/leave', async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room || !room.isActive) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.isMember(req.user._id)) {
      return res.status(409).json({ message: 'Not a member of this room' });
    }

    if (room.creator.toString() === req.user._id.toString()) {
      return res.status(409).json({ message: 'Room creator cannot leave. Transfer ownership first.' });
    }

    room.removeMember(req.user._id);
    await room.save();

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ message: 'Server error leaving room' });
  }
});

// Get room messages with pagination
router.get('/rooms/:roomId/messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const room = await Room.findById(req.params.roomId);

    if (!room || !room.isActive) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Access denied. Not a member of this room.' });
    }

    const messages = await Message.find({
      room: req.params.roomId,
      isDeleted: false
    })
    .populate('sender', 'username avatar')
    .populate('replyTo', 'content.text sender')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Mark messages as read
    const unreadMessages = messages.filter(msg => 
      !msg.readBy.some(read => read.user.toString() === req.user._id.toString())
    );

    for (const message of unreadMessages) {
      message.markAsRead(req.user._id);
      await message.save();
    }

    res.json({ 
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Fetch room messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

// Send message to room
router.post('/rooms/:roomId/messages', async (req, res) => {
  try {
    const { content, messageType = 'text', replyTo } = req.body;
    const room = await Room.findById(req.params.roomId);

    if (!room || !room.isActive) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Access denied. Not a member of this room.' });
    }

    if (!content || (messageType === 'text' && !content.text)) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = new Message({
      sender: req.user._id,
      room: req.params.roomId,
      content,
      messageType,
      replyTo: replyTo || null
    });

    await message.save();
    await message.populate('sender', 'username avatar');
    
    if (replyTo) {
      await message.populate('replyTo', 'content.text sender');
    }

    // Update room last activity
    await room.updateActivity();

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// Get private conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id, isPrivate: true },
            { recipient: req.user._id, isPrivate: true }
          ],
          isDeleted: false
        }
      },
      {
        $addFields: {
          otherUser: {
            $cond: {
              if: { $eq: ['$sender', req.user._id] },
              then: '$recipient',
              else: '$sender'
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$otherUser',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$sender', req.user._id] },
                    { $not: { $in: [req.user._id, '$readBy.user'] } }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            _id: '$user._id',
            username: '$user.username',
            avatar: '$user.avatar',
            status: '$user.status',
            lastSeen: '$user.lastSeen'
          },
          lastMessage: '$lastMessage',
          unreadCount: '$unreadCount'
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({ conversations });
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
});

// Get private messages with a user
router.get('/conversations/:userId/messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const otherUserId = req.params.userId;

    // Verify other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: otherUserId },
        { sender: otherUserId, recipient: req.user._id }
      ],
      isDeleted: false,
      isPrivate: true
    })
    .populate('sender', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Mark messages as read
    const unreadMessages = messages.filter(msg => 
      msg.recipient && msg.recipient.toString() === req.user._id.toString() &&
      !msg.readBy.some(read => read.user.toString() === req.user._id.toString())
    );

    for (const message of unreadMessages) {
      message.markAsRead(req.user._id);
      await message.save();
    }

    res.json({ 
      messages: messages.reverse(),
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Fetch private messages error:', error);
    res.status(500).json({ message: 'Server error fetching private messages' });
  }
});

// Send private message
router.post('/conversations/:userId/messages', async (req, res) => {
  try {
    const { content, messageType = 'text' } = req.body;
    const recipientId = req.params.userId;

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    if (!content || (messageType === 'text' && !content.text)) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content,
      messageType,
      isPrivate: true
    });

    await message.save();
    await message.populate('sender', 'username avatar');

    res.status(201).json({
      message: 'Private message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send private message error:', error);
    res.status(500).json({ message: 'Server error sending private message' });
  }
});

// Add reaction to message
router.post('/messages/:messageId/reactions', async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message || message.isDeleted) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const added = message.addReaction(req.user._id, emoji);
    if (!added) {
      return res.status(409).json({ message: 'Reaction already exists' });
    }

    await message.save();
    res.json({ message: 'Reaction added successfully' });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ message: 'Server error adding reaction' });
  }
});

// Remove reaction from message
router.delete('/messages/:messageId/reactions/:emoji', async (req, res) => {
  try {
    const { emoji } = req.params;
    const message = await Message.findById(req.params.messageId);

    if (!message || message.isDeleted) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.removeReaction(req.user._id, emoji);
    await message.save();

    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ message: 'Server error removing reaction' });
  }
});

// Edit message
router.put('/messages/:messageId', async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message || message.isDeleted) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!message.canEdit(req.user._id)) {
      return res.status(403).json({ message: 'Cannot edit this message' });
    }

    if (!content || !content.text) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    message.editContent(content.text);
    await message.save();

    res.json({ 
      message: 'Message edited successfully',
      data: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error editing message' });
  }
});

// Delete message
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message || message.isDeleted) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!message.canDelete(req.user._id)) {
      return res.status(403).json({ message: 'Cannot delete this message' });
    }

    message.softDelete();
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error deleting message' });
  }
});

module.exports = router;
