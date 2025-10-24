# 🔧 MongoDB Connection Troubleshooting Guide

## ❌ ปัญหาที่พบบ่อย

### 1. MongoDB Connection ล้มเหลว
```
❌ เกิดข้อผิดพลาด: MongoDB connection failed. Please check your connection string and network access.
```

### 2. SSL/TLS Handshake Error
```
❌ SSL routines:ssl3_read_bytes:tlsv1 alert internal error
```

### 3. Authentication Failed
```
❌ Authentication failed: Invalid credentials
```

### 4. Network Access Denied
```
❌ Network access denied: IP not whitelisted
```

## 🔧 วิธีแก้ไข

### 1. ตรวจสอบ MongoDB Atlas Network Access

1. เข้า [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. เลือก Project และ Cluster
3. ไปที่ **Network Access** ในเมนูซ้าย
4. คลิก **Add IP Address**
5. เลือก **Allow access from anywhere** (0.0.0.0/0)
6. คลิก **Confirm**

### 2. ตรวจสอบ Database Access

1. ไปที่ **Database Access** ในเมนูซ้าย
2. ตรวจสอบ Username และ Password
3. ตรวจสอบ Database User Privileges
4. ตั้งค่า **Read and write to any database**

### 3. ตรวจสอบ Connection String

```bash
# รูปแบบที่ถูกต้อง
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# ตัวอย่าง
mongodb+srv://nakrin_db_user:lZNUgpbFZXgTjI35@cluster0.b1dg8xo.mongodb.net/tax_management?retryWrites=true&w=majority
```

### 4. ตรวจสอบ Environment Variables

```bash
# .env.local
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
MONGODB_DATABASE=tax_management
```

### 5. ตรวจสอบ SSL/TLS Settings

```typescript
// src/lib/mongodb.ts
const options = {
  retryWrites: true,
  w: 'majority' as const,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  family: 4,
  ssl: true,
  sslValidate: false,
  authSource: 'admin',
};
```

## 🧪 การทดสอบ

### 1. ใช้ Debug Page
```
http://localhost:3000/debug-mongodb
```

### 2. ทดสอบ Connection String
```bash
# ใช้ MongoDB Compass
mongodb+srv://username:password@cluster.mongodb.net/database
```

### 3. ทดสอบ API Endpoint
```bash
curl -X POST http://localhost:3000/api/debug-mongodb \
  -H "Content-Type: application/json" \
  -d '{"test": "network"}'
```

## 🔍 การตรวจสอบปัญหา

### 1. ตรวจสอบ Logs
```bash
# ดู logs ใน terminal
npm run dev

# ดู logs ใน MongoDB Atlas
# ไปที่ Logs > Real-time Logs
```

### 2. ตรวจสอบ Network
```bash
# ทดสอบ ping
ping cluster0.b1dg8xo.mongodb.net

# ทดสอบ telnet
telnet cluster0.b1dg8xo.mongodb.net 27017
```

### 3. ตรวจสอบ SSL Certificate
```bash
# ใช้ openssl
openssl s_client -connect cluster0.b1dg8xo.mongodb.net:27017 -starttls mongodb
```

## 🚀 การแก้ไขปัญหาเฉพาะ

### 1. SSL/TLS Issues
```typescript
// เพิ่ม SSL options
const options = {
  ssl: true,
  sslValidate: false,
  authSource: 'admin',
};
```

### 2. Timeout Issues
```typescript
// เพิ่ม timeout values
const options = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
};
```

### 3. Connection Pool Issues
```typescript
// ปรับ connection pool
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
};
```

## 📋 Checklist การแก้ไข

- [ ] ตรวจสอบ MongoDB Atlas Network Access
- [ ] ตรวจสอบ Database Access
- [ ] ตรวจสอบ Connection String
- [ ] ตรวจสอบ Environment Variables
- [ ] ตรวจสอบ SSL/TLS Settings
- [ ] ทดสอบ Connection ด้วย Debug Page
- [ ] ตรวจสอบ Logs
- [ ] ตรวจสอบ Network Connectivity

## 🆘 การขอความช่วยเหลือ

หากยังแก้ไขไม่ได้ กรุณาแจ้ง:

1. **Error Message** ที่ได้รับ
2. **MongoDB Atlas Settings** (Network Access, Database Access)
3. **Connection String** (ซ่อน password)
4. **Environment Variables** (ซ่อน sensitive data)
5. **Logs** จาก terminal และ MongoDB Atlas

## 📞 ติดต่อ

- **MongoDB Atlas Support**: [support.mongodb.com](https://support.mongodb.com)
- **Documentation**: [docs.mongodb.com](https://docs.mongodb.com)
- **Community**: [community.mongodb.com](https://community.mongodb.com)
