const ActivityLog = require('../models/ActivityLog');

/**
 * Log an administrative activity
 * @param {Object} options
 * @param {Object} options.admin - req.admin object containing _id and name
 * @param {String} options.actionType - Action enum string
 * @param {String} options.entityType - Entity enum string
 * @param {String} options.entityId - Entity identifier / ID
 * @param {String} options.details - Human readable description
 * @param {Object} options.changes - Optional before/after change object
 * @param {Object} options.req - Express req object for IP capture
 */
const logActivity = async ({ admin, actionType, entityType, entityId = '', details, changes = null, req = null }) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') : '';
    const adminId = admin ? admin._id : null;
    const adminName = admin ? admin.name : 'System/Admin';

    await ActivityLog.create({
      admin: adminId,
      adminName,
      actionType,
      entityType,
      entityId: String(entityId),
      details,
      changes,
      ipAddress,
    });
  } catch (error) {
    console.error('⚠️ Failed to record activity log:', error.message);
  }
};

module.exports = { logActivity };
