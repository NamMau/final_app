import { API_URL, ENDPOINTS } from '../config/constants';
import { apiService } from './api';
import { authService } from './auth.service';

export interface Category {
  _id: string;
  userId: string;
  categoryName: string;
  description?: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
  isActive: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  categoryName: string;
  description?: string;
  icon?: string;
  color?: string;
  type: 'expense' | 'income' | 'both';
}

export interface UpdateCategoryDto {
  categoryName?: string;
  description?: string;
  icon?: string;
  color?: string;
  type?: 'expense' | 'income' | 'both';
  isActive?: boolean;
}

class CategoriesService {
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiService.get<{ categories: Category[] }>(ENDPOINTS.CATEGORIES.GET_ALL);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch categories');
      }
      return response.data.categories.filter(category => !category.isDeleted);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    try {
      const userData = await authService.getStoredUserData();
      console.log('User data:', userData);

      if (!userData) {
        throw new Error('User not authenticated');
      }

      if (!userData.id) {
        throw new Error('User ID not found in user data');
      }

      const categoryData = {
        ...data
      };

      console.log('Creating category with data:', categoryData);

      const response = await apiService.post<{ category: Category }>(ENDPOINTS.CATEGORIES.CREATE, categoryData);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create category');
      }
      return response.data.category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    try {
      const response = await apiService.put<{ updatedCategory: Category }>(ENDPOINTS.CATEGORIES.UPDATE(id), data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update category');
      }
      return response.data.updatedCategory;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete(ENDPOINTS.CATEGORIES.DELETE(id));
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete category');
      }
      return {
        success: true,
        message: response.message || 'Category deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}

export const categoriesService = new CategoriesService(); 