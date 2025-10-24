# 🔄 ย้ายข้อมูลราคางานบริการไปยัง MongoDB

## 📋 การแก้ไข

### **1. สร้าง API Route สำหรับ Services**

#### **ไฟล์: `src/app/api/services/route.ts`**
```typescript
import { NextResponse, NextRequest } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET: ดึงข้อมูลราคางานบริการทั้งหมด
export async function GET() {
  try {
    const db = await getDatabase();
    const services = db.collection('services');
    const allServices = await services.find({}).toArray();
    
    return NextResponse.json({ 
      success: true, 
      data: allServices,
      count: allServices.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// POST: เพิ่มข้อมูลราคางานบริการใหม่
export async function POST(request: NextRequest) {
  // ... implementation
}

// PUT: อัปเดตข้อมูลราคางานบริการ
export async function PUT(request: NextRequest) {
  // ... implementation
}

// DELETE: ลบข้อมูลราคางานบริการ
export async function DELETE(request: NextRequest) {
  // ... implementation
}
```

### **2. สร้าง Custom Hook สำหรับ Services**

#### **ไฟล์: `src/lib/useServiceData.ts`**
```typescript
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
  // ... implementation
}
```

### **3. อัปเดตหน้า Pricing**

#### **เดิม (ใช้ Google Sheets)**
```typescript
import useSWR from 'swr';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/...';

const { data: swrData, error: swrError, isLoading: swrIsLoading, mutate } = useSWR(GOOGLE_SCRIPT_URL, fetcher, {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
});
```

#### **ใหม่ (ใช้ MongoDB)**
```typescript
import { useServiceData, ServiceData, ServiceCategory } from '@/lib/useServiceData';

const { data: serviceCategories, error, isLoading, refreshData, addService, updateService, deleteService } = useServiceData();
```

## 🎯 ผลลัพธ์

### ✅ **การแก้ไขเสร็จแล้ว**
- **API Route** → `/api/services` สำหรับ CRUD operations
- **Custom Hook** → `useServiceData` สำหรับจัดการข้อมูล
- **หน้า Pricing** → ใช้ MongoDB แทน Google Sheets
- **Real-time Data** → ข้อมูลอัปเดตอัตโนมัติ

### 🔧 **Features ใหม่**
- **MongoDB Integration** → ใช้ฐานข้อมูล MongoDB
- **CRUD Operations** → เพิ่ม, แก้ไข, ลบ, ดึงข้อมูล
- **Real-time Sync** → ซิงค์ข้อมูลอัตโนมัติ
- **Error Handling** → จัดการข้อผิดพลาด

### 📊 **การเปรียบเทียบ**

#### **เดิม**
- ใช้ Google Sheets API
- ข้อมูลไม่ real-time
- ต้องใช้ SWR
- ขึ้นอยู่กับ Google Script

#### **ใหม่**
- ใช้ MongoDB
- ข้อมูล real-time
- ใช้ custom hook
- ควบคุมได้เต็มที่

### 🗄️ **โครงสร้างข้อมูล MongoDB**

#### **Collection: `services`**
```json
{
  "_id": "ObjectId",
  "categoryName": "หมวดหมู่บริการ",
  "categoryDescription": "คำอธิบายหมวดหมู่",
  "serviceName": "ชื่อบริการ",
  "servicePrice": 1000,
  "serviceDetails": "รายละเอียดบริการ",
  "createdAt": "2025-01-27T00:00:00.000Z",
  "updatedAt": "2025-01-27T00:00:00.000Z"
}
```

### 🚀 **API Endpoints**

#### **GET `/api/services`**
- ดึงข้อมูลราคางานบริการทั้งหมด
- Response: `{ success: true, data: [...], count: number }`

#### **POST `/api/services`**
- เพิ่มข้อมูลราคางานบริการใหม่
- Body: `{ categoryName, serviceName, servicePrice, ... }`

#### **PUT `/api/services`**
- อัปเดตข้อมูลราคางานบริการ
- Body: `{ _id, categoryName, serviceName, servicePrice, ... }`

#### **DELETE `/api/services`**
- ลบข้อมูลราคางานบริการ
- Body: `{ _id }`

## 🚀 พร้อมใช้งาน!

ตอนนี้หน้า "ราคางานบริการ" ใช้ MongoDB แล้วครับ!

- ✅ **MongoDB Integration** → ใช้ฐานข้อมูล MongoDB
- ✅ **Real-time Data** → ข้อมูลอัปเดตอัตโนมัติ
- ✅ **CRUD Operations** → เพิ่ม, แก้ไข, ลบ, ดึงข้อมูล
- ✅ **Better Performance** → ประสิทธิภาพดีขึ้น

🎯 **Perfect MongoDB migration!** 🔄📊📱⚡🔍👥🚗
