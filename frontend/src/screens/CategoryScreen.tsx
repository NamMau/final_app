import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type CategoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Category'>;

const CategoryScreen = () => {
  const navigation = useNavigation<CategoryScreenNavigationProp>();
  const [categoryName, setCategoryName] = useState('');

  const handleSubmit = () => {
    // TODO: Implement category creation logic
    console.log('Creating category:', categoryName);
    setCategoryName('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F41BB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Category Name</Text>
          <TextInput
            style={styles.input}
            value={categoryName}
            onChangeText={setCategoryName}
            placeholder="Enter category name"
            placeholderTextColor="#666"
          />
          <TouchableOpacity 
            style={[styles.submitButton, !categoryName ? styles.submitButtonDisabled : null]}
            onPress={handleSubmit}
            disabled={!categoryName}
          >
            <Text style={styles.submitButtonText}>Add Category</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
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
  formContainer: {
    backgroundColor: '#F1F4FF',
    padding: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F41BB',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#1F41BB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategoryScreen; 