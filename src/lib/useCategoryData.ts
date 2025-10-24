'use client';

import { useState, useEffect } from 'react';

export interface CategoryData {
  _id: string;
  categoryName: string;
  categoryDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryResponse {
  success: boolean;
  data: CategoryData[];
  count: number;
  error?: string;
}

export function useCategoryData() {
  const [data, setData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories');
      const result: CategoryResponse = await response.json();
      
      if (result.success) {
        setData(result.data);
        console.log('✅ [useCategoryData] ข้อมูลหมวดหมู่โหลดสำเร็จ:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to fetch categories');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ [useCategoryData] เกิดข้อผิดพลาด:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const addCategory = async (categoryData: Partial<CategoryData>): Promise<boolean> => {
    try {
      console.log('📤 [useCategoryData] เพิ่มหมวดหมู่:', categoryData);
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [useCategoryData] เพิ่มหมวดหมู่สำเร็จ');
        await fetchData(); // รีเฟรชข้อมูล
        return true;
      } else {
        console.error('❌ [useCategoryData] เพิ่มหมวดหมู่ล้มเหลว:', result.error);
        return false;
      }
    } catch (err) {
      console.error('❌ [useCategoryData] เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่:', err);
      return false;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<CategoryData>): Promise<boolean> => {
    try {
      console.log('📤 [useCategoryData] แก้ไขหมวดหมู่:', id, categoryData);
      
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _id: id, ...categoryData }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [useCategoryData] แก้ไขหมวดหมู่สำเร็จ');
        await fetchData(); // รีเฟรชข้อมูล
        return true;
      } else {
        console.error('❌ [useCategoryData] แก้ไขหมวดหมู่ล้มเหลว:', result.error);
        return false;
      }
    } catch (err) {
      console.error('❌ [useCategoryData] เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่:', err);
      return false;
    }
  };

  const deleteCategory = async (id: string, categoryName: string): Promise<boolean> => {
    try {
      console.log('📤 [useCategoryData] ลบหมวดหมู่:', id);
      
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _id: id, categoryName }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [useCategoryData] ลบหมวดหมู่สำเร็จ');
        await fetchData(); // รีเฟรชข้อมูล
        return true;
      } else {
        console.error('❌ [useCategoryData] ลบหมวดหมู่ล้มเหลว:', result.error);
        return false;
      }
    } catch (err) {
      console.error('❌ [useCategoryData] เกิดข้อผิดพลาดในการลบหมวดหมู่:', err);
      return false;
    }
  };

  const refreshData = async () => {
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    isLoading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshData,
    rawData: data // สำหรับ backward compatibility
  };
}
