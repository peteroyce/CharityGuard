const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');

// IMPORTANT: Test data route MUST come before other routes
// Generate test activity logs
router.get('/test-data/generate', async (req, res) => {
  try {
    console.log('🎲 Generating test activity logs...');

    const testLogs = [];
    const actions = [
      'transaction_blocked',
      'transaction_cleared',
      'transaction_review',
      'user_suspended',
      'user_activated',
      'user_banned',
      'bulk_action'
    ];
    
    const admins = [
      { id: 'admin1', name: 'Admin Smith' },
      { id: 'admin2', name: 'Sarah Johnson' },
      { id: 'admin3', name: 'Mike Chen' }
    ];

    // Generate 50 activity logs over the past 30 days
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const admin = admins[Math.floor(Math.random() * admins.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];

      testLogs.push({
        adminId: admin.id,
        adminName: admin.name,
        action: action,
        targetType: action.includes('user') ? 'user' : 'transaction',
        targetId: `target_${i}`,
        details: `${action.replace(/_/g, ' ')} performed by ${admin.name}`,
        timestamp: timestamp,
        metadata: {
          reason: 'Demo action',
          notes: `Test log entry ${i + 1}`
        }
      });
    }

    // Clear existing test logs
    await ActivityLog.deleteMany({
      details: { $regex: /Demo action|Test log entry/ }
    });

    console.log('🗑️  Cleared existing test logs');

    // Insert test logs
    const result = await ActivityLog.insertMany(testLogs);

    console.log(`✅ Successfully created ${result.length} test activity logs`);

    res.json({
      success: true,
      message: `Successfully created ${result.length} test activity logs`,
      data: {
        created: result.length,
        breakdown: actions.reduce((acc, action) => {
          acc[action] = result.filter(log => log.action === action).length;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('❌ Error generating test logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate test logs',
      error: error.message
    });
  }
});

// Get all activity logs with pagination and stats
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, adminId, action, targetType } = req.query;
    
    const query = {};
    if (adminId) query.adminId = adminId;
    if (action && action !== 'all') query.action = action;
    if (targetType && targetType !== 'all') query.targetType = targetType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total, stats] = await Promise.all([
      ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      ActivityLog.countDocuments(query),
      ActivityLog.aggregate([
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const actionStats = {};
    stats.forEach(stat => {
      actionStats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: logs,
      stats: actionStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
});

// Get recent activity (last 24 hours)
router.get('/recent', async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const logs = await ActivityLog.find({
      timestamp: { $gte: oneDayAgo }
    })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Error fetching recent logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent logs',
      error: error.message
    });
  }
});

// Get activity statistics for charts
router.get('/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const [actionStats, dailyStats, adminStats] = await Promise.all([
      // Group by action type
      ActivityLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Group by day
      ActivityLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Top admins by activity
      ActivityLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: '$adminName',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        actionStats,
        dailyStats,
        adminStats,
        timeRange: `Last ${days} days`
      }
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity stats',
      error: error.message
    });
  }
});

// Create activity log
router.post('/', async (req, res) => {
  try {
    const log = new ActivityLog(req.body);
    await log.save();

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create activity log',
      error: error.message
    });
  }
});

module.exports = router;
