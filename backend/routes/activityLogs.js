const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const {
  validatePagination,
  validateActivityLogCreate,
  validateActivityLogStats
} = require('../middleware/validation');

// All activity log routes require authentication
router.use(authenticate);

// Generate test activity logs — admin only
router.get('/test-data/generate', authorize('admin'), async (req, res) => {
  try {
    const testLogs = [];
    const actions = [
      'transaction_blocked', 'transaction_cleared', 'transaction_review',
      'user_suspended', 'user_activated', 'user_banned', 'bulk_action'
    ];

    const admins = [
      { id: 'admin1', name: 'Admin Smith' },
      { id: 'admin2', name: 'Sarah Johnson' },
      { id: 'admin3', name: 'Mike Chen' }
    ];

    // Generate 50 activity logs over the past 30 days using deterministic offsets
    for (let i = 0; i < 50; i++) {
      const daysAgo = i % 30;
      const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const admin = admins[i % admins.length];
      const action = actions[i % actions.length];

      testLogs.push({
        adminId: admin.id,
        adminName: admin.name,
        action,
        targetType: action.includes('user') ? 'user' : 'transaction',
        targetId: `target_${i}`,
        details: `${action.replace(/_/g, ' ')} performed by ${admin.name}`,
        timestamp,
        metadata: { reason: 'Demo action', notes: `Test log entry ${i + 1}` }
      });
    }

    await ActivityLog.deleteMany({ details: { $regex: /Demo action|Test log entry/ } });
    const result = await ActivityLog.insertMany(testLogs);

    logger.info(`Generated ${result.length} test activity logs`);
    res.json({ success: true, message: `Successfully created ${result.length} test activity logs` });
  } catch (error) {
    logger.error('Error generating test logs:', error);
    res.status(500).json({ success: false, error: 'Failed to generate test logs', details: error.message });
  }
});

// Get recent activity (last 24 hours) — any authenticated user
router.get('/recent', async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logs = await ActivityLog.find({ timestamp: { $gte: oneDayAgo } })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({ success: true, data: logs, count: logs.length });
  } catch (error) {
    logger.error('Error fetching recent logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent logs', details: error.message });
  }
});

// Get activity statistics — any authenticated user
router.get('/stats', validateActivityLogStats, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const [actionStats, dailyStats, adminStats] = await Promise.all([
      ActivityLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      ActivityLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      ActivityLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$adminName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      data: { actionStats, dailyStats, adminStats, timeRange: `Last ${days} days` }
    });
  } catch (error) {
    logger.error('Error fetching activity stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity stats', details: error.message });
  }
});

// Get all activity logs — admin only
router.get('/', authorize('admin'), ...validatePagination(['timestamp', 'action', 'adminName']), async (req, res) => {
  try {
    const { page = 1, limit = 50, adminId, action, targetType } = req.query;

    const query = {};
    if (adminId) query.adminId = adminId;
    if (action && action !== 'all') query.action = action;
    if (targetType && targetType !== 'all') query.targetType = targetType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total, stats] = await Promise.all([
      ActivityLog.find(query).sort({ timestamp: -1 }).limit(parseInt(limit)).skip(skip),
      ActivityLog.countDocuments(query),
      ActivityLog.aggregate([{ $group: { _id: '$action', count: { $sum: 1 } } }])
    ]);

    const actionStats = {};
    stats.forEach(stat => { actionStats[stat._id] = stat.count; });

    res.json({
      success: true,
      data: logs,
      stats: actionStats,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    logger.error('Error fetching activity logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity logs', details: error.message });
  }
});

// Create activity log entry — admin only
router.post('/', authorize('admin'), validateActivityLogCreate, async (req, res) => {
  try {
    const { action, targetType, targetId, details, metadata } = req.body;

    const log = await ActivityLog.create({
      adminId: req.user._id.toString(),
      adminName: req.user.username || req.user.email,
      action,
      targetType,
      targetId,
      details,
      metadata,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    logger.error('Error creating activity log:', error);
    res.status(500).json({ success: false, error: 'Failed to create activity log', details: error.message });
  }
});

module.exports = router;
