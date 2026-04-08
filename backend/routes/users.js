const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validateObjectId,
  validatePagination,
  validateUserStatusUpdate,
  validateUserNotes,
  validateUserProfile,
  validateWalletAddress,
  validateEINParam,
  validateExportQuery,
  validateDonationQuery
} = require('../middleware/validation');

// Test data generation route — admin only
router.get('/test-data/generate', authenticate, authorize('admin'), userController.generateTestUsers);

// UNIFIED STATUS UPDATE ROUTE — admin only
router.patch('/:id/status', authenticate, authorize('admin'), validateUserStatusUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, adminId, adminName } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oldStatus = user.accountStatus;

    if (action === 'suspend') {
      user.accountStatus = 'suspended';
      user.suspensionReason = reason;
      user.suspendedAt = new Date();
      user.suspendedBy = req.user._id.toString();
    } else if (action === 'activate') {
      user.accountStatus = 'active';
      user.suspensionReason = null;
      user.suspendedAt = null;
      user.suspendedBy = null;
    } else if (action === 'ban') {
      user.accountStatus = 'banned';
      user.suspensionReason = reason;
      user.suspendedAt = new Date();
      user.suspendedBy = req.user._id.toString();
      user.isActive = false;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Use: suspend, activate, or ban.' });
    }

    await user.save();

    const actionLogMap = { suspend: 'user_suspended', activate: 'user_activated', ban: 'user_banned' };
    await ActivityLog.create({
      adminId: req.user._id.toString(),
      adminName: req.user.username || req.user.email,
      action: actionLogMap[action],
      targetType: 'user',
      targetId: user._id.toString(),
      details: `User ${user.username} was ${action}d. Reason: ${reason || 'No reason provided'}`,
      ipAddress: req.ip,
      metadata: { reason, previousStatus: oldStatus, newStatus: user.accountStatus }
    });

    res.json({ success: true, message: `User ${action}d successfully`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
});

// Get user details — admin only
router.get('/:id/details', authenticate, authorize('admin'), ...validateObjectId('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-__v');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const activityLogs = await ActivityLog.find({ targetId: id }).sort({ timestamp: -1 }).limit(20);

    res.json({
      success: true,
      data: { ...user.toObject(), recentDonations: user.donations || [], activityLogs }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user details', error: error.message });
  }
});

// GET all users — admin only
router.get('/', authenticate, authorize('admin'), ...validatePagination(['createdAt', 'email', 'username', 'accountStatus']), async (req, res) => {
  try {
    const { page = 1, limit = 100, search, status, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { walletAddress: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.accountStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [users, total, stats] = await Promise.all([
      User.find(query).select('-__v').sort({ [sortBy]: sortOrder }).limit(parseInt(limit)).skip(skip),
      User.countDocuments(query),
      Promise.all([
        User.countDocuments(),
        User.countDocuments({ accountStatus: 'active' }),
        User.countDocuments({ accountStatus: 'suspended' }),
        User.countDocuments({ accountStatus: 'banned' }),
        User.countDocuments({ isVerified: true })
      ]).then(([total, active, suspended, banned, verified]) => ({
        total, active, suspended, banned, verified
      }))
    ]);

    res.json({
      success: true,
      data: users,
      stats,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

// Export users — admin only
router.get('/export', authenticate, authorize('admin'), validateExportQuery, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status && status !== 'all' ? { accountStatus: status } : {};

    const users = await User.find(query)
      .select('email username walletAddress totalDonations donationCount accountStatus createdAt isVerified')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: users, count: users.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export users', error: error.message });
  }
});

// Update user notes — admin only
router.patch('/:userId/notes', authenticate, authorize('admin'), validateUserNotes, async (req, res) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;

    const user = await User.findByIdAndUpdate(userId, { notes }, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User notes updated', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user notes', error: error.message });
  }
});

// Get user by wallet address (public — auto-creates user on first visit)
router.get('/wallet/:walletAddress', ...validateWalletAddress(), async (req, res) => {
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
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Get user donations by wallet address (public)
router.get('/wallet/:walletAddress/donations', ...validateWalletAddress(), validateDonationQuery, async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const [donations, total] = await Promise.all([
      Transaction.find({ donorAddress: walletAddress }).sort({ timestamp: -1 }).limit(parseInt(limit)).skip(parseInt(skip)),
      Transaction.countDocuments({ donorAddress: walletAddress })
    ]);

    res.json({ donations, total, count: donations.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch donation history' });
  }
});

// Update user profile by wallet address (public)
router.put('/wallet/:walletAddress', ...validateWalletAddress(), validateUserProfile, async (req, res) => {
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
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Add favorite nonprofit (public)
router.post('/wallet/:walletAddress/favorites/:ein', ...validateWalletAddress(), ...validateEINParam, async (req, res) => {
  try {
    const { walletAddress, ein } = req.params;

    const user = await User.findOneAndUpdate(
      { walletAddress },
      { $addToSet: { favoriteNonprofits: ein } },
      { new: true, upsert: true }
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add favorite nonprofit' });
  }
});

// Remove favorite nonprofit (public)
router.delete('/wallet/:walletAddress/favorites/:ein', ...validateWalletAddress(), ...validateEINParam, async (req, res) => {
  try {
    const { walletAddress, ein } = req.params;

    const user = await User.findOneAndUpdate(
      { walletAddress },
      { $pull: { favoriteNonprofits: ein } },
      { new: true }
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

module.exports = router;
