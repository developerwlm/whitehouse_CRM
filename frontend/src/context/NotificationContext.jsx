import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { io } from 'socket.io-client';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { info } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {}
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Socket.IO real-time connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let socket;
    try {
      socket = io('/', { transports: ['websocket', 'polling'] });

      socket.on('connect', () => {
        socket.emit('join', { userId: user.id || user._id, role: user.role });
      });

      socket.on('notification', (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
        info(`🔔 ${newNotif.title}: ${newNotif.message}`);
      });
    } catch (err) {}

    return () => {
      if (socket) socket.disconnect();
    };
  }, [isAuthenticated, user, info]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
