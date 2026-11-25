const { AuditLog } = require('../models');

// @desc Get system audit logs (Admin only)
// @route GET /api/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const { module, action, userId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (module) query.module = module;
    if (action) query.action = action;
    if (userId) query.userId = userId;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAuditLogs };
