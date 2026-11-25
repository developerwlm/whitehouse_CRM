const { AuditLog } = require('../models');

/**
 * Creates an audit log entry for significant business operations
 */
const logAudit = async ({
  userId = null,
  userName = 'System',
  userRole = 'system',
  action,
  module,
  targetId = '',
  description = '',
  previousData = null,
  updatedData = null,
  req = null,
}) => {
  try {
    const ipAddress = req ? req.ip || req.headers['x-forwarded-for'] || '' : '';
    const userAgent = req ? req.headers['user-agent'] || '' : '';

    await AuditLog.create({
      userId,
      userName,
      userRole,
      action,
      module,
      targetId,
      description,
      previousData,
      updatedData,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record log:', err.message);
  }
};

module.exports = { logAudit };
