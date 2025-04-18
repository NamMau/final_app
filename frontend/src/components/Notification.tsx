import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info';
}

export const Notification: React.FC<NotificationProps> = ({ message, type = 'success' }) => {
  return (
    <View style={[styles.container, type === 'success' && styles.successContainer]}>
      <View style={styles.border}>
        <View style={styles.content}>
          <Text style={styles.message}>🎉 {message}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  successContainer: {
    backgroundColor: '#f0fff0', // Light green background
  },
  border: {
    borderWidth: 2,
    borderColor: '#90EE90', // Light green border
    borderRadius: 8,
    padding: 10,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E8B57', // Sea green text
    textAlign: 'center',
  },
}); 