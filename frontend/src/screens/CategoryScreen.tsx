import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { categoriesService, Category, CreateCategoryDto } from '../services/categories.service';
import { Notification } from '../components/Notification';

type CategoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Category'>;

const CategoryScreen = () => {
  const navigation = useNavigation<CategoryScreenNavigationProp>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [newCategory, setNewCategory] = useState<CreateCategoryDto>({
    categoryName: '',
    type: 'expense',
    icon: 'receipt',
    color: '#1F41BB'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await categoriesService.getCategories();
      setCategories(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load categories');
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.categoryName.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }

    try {
      await categoriesService.createCategory(newCategory);
      setShowAddForm(false);
      setNewCategory({
        categoryName: '',
        type: 'expense',
        icon: 'receipt',
        color: '#1F41BB'
      });
      loadCategories();
    } catch (error) {
      Alert.alert('Error', 'Failed to create category');
      console.error('Error creating category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoriesService.deleteCategory(id);
              setNotificationMessage('Category deleted successfully');
              setShowNotification(true);
              loadCategories();
              setTimeout(() => setShowNotification(false), 3000);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
              console.error('Error deleting category:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Ionicons name={showAddForm ? "close" : "add"} size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentSection}>
        {showAddForm && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Add New Category</Text>
            <TextInput
              style={styles.input}
              placeholder="Category Name"
              value={newCategory.categoryName}
              onChangeText={(text) => setNewCategory({ ...newCategory, categoryName: text })}
            />
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleAddCategory}
            >
              <Text style={styles.submitButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.categoriesList}>
          {categories.map((category) => (
            <View key={category._id} style={styles.categoryItem}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <Ionicons name={category.icon as any} size={24} color="#FFF" />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.categoryName}</Text>
                <Text style={styles.categoryType}>{category.type}</Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteCategory(category._id)}
              >
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {showNotification && (
        <Notification
          message={notificationMessage}
          type="success"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F41BB',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
  },
  formContainer: {
    marginHorizontal: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F41BB',
    marginBottom: 16,
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
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F41BB',
  },
  categoryType: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
});

export default CategoryScreen; 