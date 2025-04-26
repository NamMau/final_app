import { ENDPOINTS } from '../config/constants';
import { apiService } from './api';
import { authService } from './auth.service';

export interface Notification {
  _id: string;
  userId: string;
  message: string;
  type: 'budget_alert' | 'bill_due' | 'goal_achieved' | 'loan_payment' | 'system';
  priority: 'low' | 'medium' | 'high';
  status: 'read' | 'unread';
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  message?: string;
  data?: {
    notifications?: Notification[];
    notification?: Notification;
  };
}

class NotificationService {
  async getUserNotifications(): Promise<NotificationResponse> {
    try {
      console.log('Fetching user notifications');
      const userData = await authService.getStoredUserData();
      if (!userData || !userData._id) {
        console.error('No user data found for notifications');
        return { success: false, message: 'User not authenticated' };
      }

      const endpoint = ENDPOINTS.NOTIFICATIONS.GET_USER.replace('${userID}', userData._id);
      console.log('Notification endpoint:', endpoint);
      
      const response = await apiService.get<any>(endpoint);
      console.log('Notification response:', response);
      
      return {
        success: true,
        data: {
          notifications: response.data?.notifications || []
        },
        message: response.message || 'Notifications retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        message: 'Failed to fetch notifications'
      };
    }
  }

  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    try {
      const endpoint = ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId);
      const response = await apiService.put<any>(endpoint, {});
      
      return {
        success: true,
        data: {
          notification: response.data?.notification
        },
        message: 'Notification marked as read'
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        message: 'Failed to mark notification as read'
      };
    }
  }

  async deleteNotification(notificationId: string): Promise<NotificationResponse> {
    try {
      const endpoint = ENDPOINTS.NOTIFICATIONS.DELETE(notificationId);
      await apiService.delete<any>(endpoint);
      
      return {
        success: true,
        message: 'Notification deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        message: 'Failed to delete notification'
      };
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
