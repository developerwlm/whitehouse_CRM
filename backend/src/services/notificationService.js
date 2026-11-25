const { Notification } = require('../models');

let ioInstance = null;

const setSocketIO = (io) => {
  ioInstance = io;
};

/**
 * Creates an in-app notification and emits a real-time event.
 */
const createNotification = async ({
  recipientId = null,
  roleTarget = 'all',
  title,
  message,
  type = 'system',
  link = '',
  relatedEntityId = null,
  relatedEntityType = '',
}) => {
  try {
    const notification = await Notification.create({
      recipientId,
      roleTarget,
      title,
      message,
      type,
      link,
      relatedEntityId,
      relatedEntityType,
    });

    if (ioInstance) {
      if (recipientId) {
        ioInstance.to(`user:${recipientId}`).emit('notification', notification);
      } else if (roleTarget && roleTarget !== 'all') {
        ioInstance.to(`role:${roleTarget}`).emit('notification', notification);
      } else {
        ioInstance.emit('notification', notification);
      }
    }

    return notification;
  } catch (err) {
    console.error('[NotificationService] Error:', err.message);
    return null;
  }
};

module.exports = {
  createNotification,
  setSocketIO,
};
