const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');

// Test data generation route (MUST BE FIRST!)
router.get('/test-data/generate', userController.generateTestUsers);

// UNIFIED STATUS UPDATE ROUTE
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, adminId, adminName } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldStatus = user.accountStatus;

    // Update status based on action
    if (action === 'suspend') {
      user.accountStatus = 'suspended';
      user.suspensionReason = reason;
      user.suspendedAt = new Date();
      user.suspendedBy = adminId || 'admin';
    } else if (action === 'activate') {
      user.accountStatus = 'active';
      user.suspensionReason = null;
      user.suspendedAt = null;
      user.suspendedBy = null;
    } else if (action === 'ban') {
      user.accountStatus = 'banned';
      user.suspensionReason = reason;
      user.suspendedAt = new Date();
      user.suspendedBy = adminId || 'admin';
      user.isActive = false;
    }

    await user.save();

    // Log the activity
    await ActivityLog.create({
      adminId: adminId || 'admin',
      adminName: adminName || 'Admin',
      action: `user_${action}d`,
      targetType: 'user',
      targetId: user._id,
      details: `User ${user.username} was ${action}d. Reason: ${reason || 'No reason provided'}`,
      metadata: {
        reason,
        previousStatus: oldStatus,
        newStatus: user.accountStatus
      }
    });

    res.json({
      success: true,
      message: `User ${action}d successfully`,
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// Get user details with donation history
router.get('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get activity logs for this user
    const activityLogs = await ActivityLog.find({ targetId: id })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        recentDonations: user.donations || [],
        activityLogs
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
});

// GET all users (for admin dashboard)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, search, status, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { walletAddress: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status && status !== 'all') {
      query.accountStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-__v')
        .sort({ [sortBy]: sortOrder })
        .limit(parseInt(limit))
        .skip(skip),
      User.countDocuments(query)
    ]);

    // Get stats
    const stats = {
      total: await User.countDocuments(),
      active: await User.countDocuments({ accountStatus: 'active' }),
      suspended: await User.countDocuments({ accountStatus: 'suspended' }),
      banned: await User.countDocuments({ accountStatus: 'banned' }),
      verified: await User.countDocuments({ isVerified: true })
    };

    res.json({
      success: true,
      data: users,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Export users to CSV data
router.get('/export', async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = status && status !== 'all' ? { accountStatus: status } : {};
    
    const users = await User.find(query)
      .select('email username walletAddress totalDonations donationCount accountStatus createdAt isVerified')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export users',
      error: error.message
    });
  }
});

// Update user notes
router.patch('/:userId/notes', async (req, res) => {
  try {
    const { userId } = req.params;
    const { notes, adminId = 'admin' } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { notes },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User notes updated',
      data: user
    });
  } catch (error) {
    console.error('Error updating user notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user notes',
      error: error.message
    });
  }
});

// Get user by wallet address
router.get('/wallet/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    let user = await User.findOne({ walletAddress });
    
    if (!user) {
      user = new User({
        walletAddress,
        email: '',
        username: `User_${walletAddress.slice(0, 6)}`,
        totalDonations: 0,
        donationCount: 0,
        favoriteNonprofits: []
      });
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Get user donations
router.get('/wallet/:walletAddress/donations', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    const donations = await Transaction.find({ from: walletAddress })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await Transaction.countDocuments({ from: walletAddress });
    
    res.json({ donations, total, count: donations.length });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Failed to fetch donation history' });
  }
});

// Update user profile
router.put('/wallet/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { email, username } = req.body;
    
    const user = await User.findOneAndUpdate(
      { walletAddress },
      { email, username, lastUpdated: new Date() },
      { new: true, upsert: true }
    );
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Add favorite nonprofit
router.post('/wallet/:walletAddress/favorites/:ein', async (req, res) => {
  try {
    const { walletAddress, ein } = req.params;
    
    const user = await User.findOneAndUpdate(
      { walletAddress },
      { $addToSet: { favoriteNonprofits: ein } },
      { new: true, upsert: true }
    );
    
    res.json(user);
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite nonprofit' });
  }
});

// Remove favorite nonprofit
router.delete('/wallet/:walletAddress/favorites/:ein', async (req, res) => {
  try {
    const { walletAddress, ein } = req.params;
    
    const user = await User.findOneAndUpdate(
      { walletAddress },
      { $pull: { favoriteNonprofits: ein } },
      { new: true }
    );
    
    res.json(user);
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

module.exports = router;


