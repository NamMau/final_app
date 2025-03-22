import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import * as ImagePicker from 'expo-image-picker';
import { billsService } from '../services/bills.service';

type BillScannerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BillScanner'>;

const BillScannerScreen = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const navigation = useNavigation<BillScannerScreenNavigationProp>();

  const handleCapture = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera permissions to make this work!');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        handleOCR(result.assets[0]);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      alert('Error capturing image. Please try again.');
    }
  };

  const handleOCR = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    try {
      setScanning(true);
      
      // Create a File object from the image URI
      const response = await fetch(imageAsset.uri);
      const blob = await response.blob();
      const file = new File([blob], 'bill.jpg', { type: 'image/jpeg' });

      // Send to backend for OCR processing
      const result = await billsService.scanBill(file);
      setScannedText(result.ocrText);

    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F41BB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Bill</Text>
      </View>

      <View style={styles.content}>
        {image ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.previewImage} />
            {scanning && (
              <View style={styles.scanningOverlay}>
                <ActivityIndicator size="large" color="#1F41BB" />
                <Text style={styles.scanningText}>Processing image...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="receipt-outline" size={80} color="#1F41BB" />
            <Text style={styles.placeholderText}>Take a photo of your bill</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.captureButton}
          onPress={handleCapture}
          disabled={scanning}
        >
          <Text style={styles.captureButtonText}>
            {image ? 'Retake Photo' : 'Take Photo'}
          </Text>
        </TouchableOpacity>

        {scannedText ? (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Scanned Text:</Text>
            <Text style={styles.resultText}>{scannedText}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4FF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F41BB',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    aspectRatio: 4/3,
    backgroundColor: '#F1F4FF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1F41BB',
  },
  placeholderContainer: {
    aspectRatio: 4/3,
    backgroundColor: '#F1F4FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  captureButton: {
    backgroundColor: '#1F41BB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F1F4FF',
    borderRadius: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F41BB',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
  },
});

export default BillScannerScreen; 