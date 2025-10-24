import { useState, useEffect } from 'react';

export interface ServiceData {
  _id: string;
  categoryName: string;
  categoryDescription: string;
  serviceName: string;
  servicePrice: number;
  serviceDetails: string;
  createdAt: string;
  updatedAt: string;
  rowIndex?: number;
}

export interface ServiceCategory {
  name: string;
  description: string;
  services: ServiceData[];
}

interface UseServiceDataReturn {
  data: ServiceCategory[];
  rawData: ServiceData[];
  error: string | null;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  addService: (serviceData: Partial<ServiceData>) => Promise<boolean>;
  updateService: (id: string, serviceData: Partial<ServiceData>) => Promise<boolean>;
  deleteService: (id: string) => Promise<boolean>;
}

export function useServiceData(): UseServiceDataReturn {
  const [data, setData] = useState<ServiceCategory[]>([]);
  const [rawData, setRawData] = useState<ServiceData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 [useServiceData] Fetching services data...');
      
      const response = await fetch('/api/services');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch services');
      }
      
      if (result.success && result.data) {
        console.log(`✅ [useServiceData] Fetched ${result.data.length} services`);
        
        // แปลงข้อมูลเป็นรูปแบบที่ต้องการ
        const serviceData: ServiceData[] = result.data.map((item: Record<string, unknown>) => ({
          _id: item._id,
          categoryName: item.categoryName || '',
          categoryDescription: item.categoryDescription || '',
          serviceName: item.serviceName || '',
          servicePrice: item.servicePrice || 0,
          serviceDetails: item.serviceDetails || '',
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
          rowIndex: item.rowIndex as number | undefined
        }));
        
        setRawData(serviceData);
        
        // จัดกลุ่มข้อมูลตามหมวดหมู่
        const categories: ServiceCategory[] = serviceData.reduce((acc: ServiceCategory[], service: ServiceData) => {
          let category = acc.find(cat => cat.name === service.categoryName);
          if (!category) {
            category = {
              name: service.categoryName,
              description: service.categoryDescription,
              services: []
            };
            acc.push(category);
          }
          category.services.push(service);
          return acc;
        }, []);
        
        setData(categories);
        console.log(`✅ [useServiceData] Organized into ${categories.length} categories`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('❌ [useServiceData] Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData([]);
      setRawData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchData();
  };

  const addService = async (serviceData: Partial<ServiceData>): Promise<boolean> => {
    try {
      console.log('📝 [useServiceData] Adding service:', serviceData);
      
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add service');
      }
      
      if (result.success) {
        console.log('✅ [useServiceData] Service added successfully');
        await refreshData(); // รีเฟรชข้อมูล
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('❌ [useServiceData] Error adding service:', err);
      setError(err instanceof Error ? err.message : 'Failed to add service');
      return false;
    }
  };

  const updateService = async (id: string, serviceData: Partial<ServiceData>): Promise<boolean> => {
    try {
      console.log('🔄 [useServiceData] Updating service:', id, serviceData);
      
      const response = await fetch('/api/services', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _id: id, ...serviceData }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update service');
      }
      
      if (result.success) {
        console.log('✅ [useServiceData] Service updated successfully');
        await refreshData(); // รีเฟรชข้อมูล
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('❌ [useServiceData] Error updating service:', err);
      setError(err instanceof Error ? err.message : 'Failed to update service');
      return false;
    }
  };

  const deleteService = async (id: string): Promise<boolean> => {
    try {
      console.log('🗑️ [useServiceData] Deleting service:', id);
      
      const response = await fetch('/api/services', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _id: id }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete service');
      }
      
      if (result.success) {
        console.log('✅ [useServiceData] Service deleted successfully');
        await refreshData(); // รีเฟรชข้อมูล
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('❌ [useServiceData] Error deleting service:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete service');
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    rawData,
    error,
    isLoading,
    refreshData,
    addService,
    updateService,
    deleteService
  };
}
