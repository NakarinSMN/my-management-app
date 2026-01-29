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

export interface ServiceFilters {
  searchTerm?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  pageSize?: number;
}

interface UseServiceDataReturn {
  data: ServiceCategory[];
  rawData: ServiceData[];
  error: string | null;
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  refreshData: () => Promise<void>;
  addService: (serviceData: Partial<ServiceData>) => Promise<boolean>;
  updateService: (id: string, serviceData: Partial<ServiceData>) => Promise<boolean>;
  deleteService: (id: string) => Promise<boolean>;
}

export function useServiceData(filters?: ServiceFilters): UseServiceDataReturn {
  const [data, setData] = useState<ServiceCategory[]>([]);
  const [rawData, setRawData] = useState<ServiceData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const {
    searchTerm = '',
    category = '',
    minPrice,
    maxPrice,
    pageSize: filtersPageSize,
  } = filters || {};

  const pageSize = filtersPageSize && filtersPageSize > 0 ? filtersPageSize : 100;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 [useServiceData] Fetching services data with filters...', {
        searchTerm,
        category,
        minPrice,
        maxPrice,
        page,
        pageSize,
      });

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));

      if (searchTerm) {
        params.set('search', searchTerm);
      }

      if (category) {
        params.set('category', category);
      }

      if (typeof minPrice === 'number' && minPrice > 0) {
        params.set('minPrice', String(minPrice));
      }

      if (typeof maxPrice === 'number' && maxPrice > 0) {
        params.set('maxPrice', String(maxPrice));
      }
      
      const response = await fetch(`/api/services?${params.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch services');
      }
      
      if (result.success && result.data) {
        console.log(`✅ [useServiceData] Fetched ${result.data.length} services (total: ${result.total ?? result.count ?? result.data.length})`);
        
        // แปลงข้อมูลเป็นรูปแบบที่ต้องการ
        const serviceData: ServiceData[] = result.data.map((item: Record<string, unknown>) => ({
          _id: item._id,
          categoryName: item.categoryName || '',
          categoryDescription: item.categoryDescription || '',
          serviceName: item.serviceName || '',
          servicePrice: item.servicePrice || 0,
          serviceDetails: item.serviceDetails || '',
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : (item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date().toISOString()),
          updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : (item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date().toISOString()),
          rowIndex: item.rowIndex as number | undefined
        }));
        
        setRawData(serviceData);
        setTotal(result.total ?? result.count ?? serviceData.length);
        
        // จัดกลุ่มข้อมูลตามหมวดหมู่
        const categories: ServiceCategory[] = serviceData.reduce((acc: ServiceCategory[], service: ServiceData) => {
          let categoryGroup = acc.find(cat => cat.name === service.categoryName);
          if (!categoryGroup) {
            categoryGroup = {
              name: service.categoryName,
              description: service.categoryDescription,
              services: []
            };
            acc.push(categoryGroup);
          }
          categoryGroup.services.push(service);
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
      setTotal(0);
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

  // รีเซ็ตหน้าเป็น 1 เมื่อ filter เปลี่ยน
  useEffect(() => {
    setPage(1);
  }, [searchTerm, category, minPrice, maxPrice, pageSize]);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, searchTerm, category, minPrice, maxPrice]);

  return {
    data,
    rawData,
    error,
    isLoading,
    total,
    page,
    pageSize,
    setPage,
    refreshData,
    addService,
    updateService,
    deleteService
  };
}
