const { Notification } = require('../models');

// @desc Get user notifications
// @route GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const user = req.user;
    const query = {
      $or: [
        { recipientId: user._id },
        { roleTarget: user.role },
        { roleTarget: 'all' },
      ],
    };

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

    res.json({ success: true, count: notifications.length, unreadCount, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Mark notification as read
// @route PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Mark all user notifications as read
// @route PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    const user = req.user;
    await Notification.updateMany(
      {
        $or: [{ recipientId: user._id }, { roleTarget: user.role }, { roleTarget: 'all' }],
        isRead: false,
      },
      { isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
