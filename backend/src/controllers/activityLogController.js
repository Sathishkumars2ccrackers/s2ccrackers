const ActivityLog = require('../models/ActivityLog');

// @desc    Get activity logs (Admin)
// @route   GET /api/activity-logs/admin
// @access  Private (Admin)
const getActivityLogs = async (req, res, next) => {
  try {
    const { actionType, entityType, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (actionType && actionType !== 'all') {
      query.actionType = actionType;
    }

    if (entityType && entityType !== 'all') {
      query.entityType = entityType;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ details: searchRegex }, { adminName: searchRegex }, { entityId: searchRegex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      ActivityLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActivityLogs };
