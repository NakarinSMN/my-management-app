# 🚀 คู่มือการ Deploy ไป Production

## ⚠️ สิ่งสำคัญที่ต้องทำก่อน Deploy

### 1. ตั้งค่า Environment Variables ใน Production

เมื่อ deploy ไป production (Vercel, Netlify, Railway, etc.) **ต้องตั้งค่า Environment Variables** ใน platform ที่ใช้

#### Environment Variables ที่ต้องตั้งค่า:

```env
MONGODB_URI=mongodb+srv://nakrin_db_user:2240444SmnQ@cluster0.b1dg8xo.mongodb.net/tax_management?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DATABASE=tax_management
NEXTAUTH_SECRET=gibPVWJbvx9dfnitpuJzzTE6hNA0s2qfR7ISuQn8oEY=
NEXTAUTH_URL=https://your-domain.com
```

**สำคัญ:**
- `NEXTAUTH_URL` ต้องเป็น **production URL** (เช่น `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET` ใช้ตัวเดียวกับ development หรือสร้างใหม่ก็ได้ (แนะนำให้สร้างใหม่เพื่อความปลอดภัย)
- `MONGODB_URI` ใช้ตัวเดียวกับ development ได้

---

## 📦 วิธี Deploy ตาม Platform

### 🟢 Vercel (แนะนำ)

1. **Push code ไป GitHub/GitLab/Bitbucket**

2. **เชื่อมต่อกับ Vercel:**
   - ไปที่ [vercel.com](https://vercel.com)
   - Import project จาก Git repository

3. **ตั้งค่า Environment Variables:**
   - ไปที่ Project Settings > Environment Variables
   - เพิ่ม variables ต่อไปนี้:
     ```
     MONGODB_URI=mongodb+srv://...
     MONGODB_DATABASE=tax_management
     NEXTAUTH_SECRET=gibPVWJbvx9dfnitpuJzzTE6hNA0s2qfR7ISuQn8oEY=
     NEXTAUTH_URL=https://your-app.vercel.app
     ```
   - เลือก **Production, Preview, Development** ทั้งหมด
   - คลิก Save

4. **Deploy:**
   - Vercel จะ deploy อัตโนมัติเมื่อ push code
   - หรือคลิก "Redeploy" ใน dashboard

5. **อัปเดต NEXTAUTH_URL:**
   - หลังจาก deploy เสร็จ ให้ copy production URL
   - ไปที่ Environment Variables
   - แก้ไข `NEXTAUTH_URL` เป็น URL ที่ถูกต้อง
   - Redeploy อีกครั้ง

---

### 🔵 Netlify

1. **Push code ไป Git repository**

2. **เชื่อมต่อกับ Netlify:**
   - ไปที่ [netlify.com](https://netlify.com)
   - New site from Git

3. **ตั้งค่า Build Settings:**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

4. **ตั้งค่า Environment Variables:**
   - ไปที่ Site settings > Environment variables
   - เพิ่ม variables ทั้งหมด
   - **สำคัญ:** ต้องเพิ่ม `NEXTAUTH_URL` หลังจาก deploy แล้ว (ใช้ production URL)

5. **Deploy และ Redeploy:**
   - Deploy ครั้งแรก
   - Copy production URL
   - อัปเดต `NEXTAUTH_URL` ใน Environment Variables
   - Trigger redeploy

---

### 🟡 Railway

1. **Deploy จาก GitHub:**
   - ไปที่ [railway.app](https://railway.app)
   - New Project > Deploy from GitHub

2. **ตั้งค่า Environment Variables:**
   - ไปที่ Variables tab
   - เพิ่ม variables ทั้งหมด

3. **ตั้งค่า NEXTAUTH_URL:**
   - หลังจาก deploy แล้ว ให้ copy production URL
   - อัปเดต `NEXTAUTH_URL` ใน Variables
   - Redeploy

---

## 🔒 ความปลอดภัย

### ✅ Best Practices:

1. **ใช้ Secret ใหม่สำหรับ Production:**
   ```bash
   # สร้าง secret ใหม่
   openssl rand -base64 32
   ```

2. **อย่า commit `.env.local` ไปที่ Git:**
   - ไฟล์ `.env.local` ถูก ignore แล้ว (ใน `.gitignore`)
   - ตรวจสอบว่าไม่มี sensitive data ใน code

3. **ตั้งค่า MongoDB Network Access:**
   - ใน MongoDB Atlas > Network Access
   - เพิ่ม IP ของ production server (หรือ 0.0.0.0/0 สำหรับ Vercel/Netlify)

4. **ใช้ HTTPS เท่านั้น:**
   - Production URL ต้องเป็น `https://`
   - NextAuth จะใช้ `secure: true` สำหรับ cookies ใน production

---

## 🧪 ทดสอบหลัง Deploy

1. **ทดสอบ Login:**
   - ไปที่ production URL
   - ลอง login
   - ตรวจสอบว่า redirect ไป dashboard ได้

2. **ตรวจสอบ Cookies:**
   - เปิด DevTools > Application > Cookies
   - ตรวจสอบว่ามี `next-auth.session-token` หรือไม่
   - ตรวจสอบว่า cookie มี flag `Secure` และ `HttpOnly`

3. **ทดสอบ API:**
   - ตรวจสอบว่า API calls ทำงานได้ (ไม่ใช่ 401)
   - ตรวจสอบว่า middleware ทำงานถูกต้อง

---

## 🐛 Troubleshooting

### ปัญหา: Login ไม่ทำงานใน Production

**แก้ไข:**
1. ตรวจสอบว่า `NEXTAUTH_URL` ถูกตั้งค่าถูกต้อง (ต้องเป็น production URL)
2. ตรวจสอบว่า `NEXTAUTH_SECRET` ถูกตั้งค่าแล้ว
3. ตรวจสอบ Console logs ใน browser
4. ตรวจสอบ Vercel/Netlify logs

### ปัญหา: 401 Unauthorized

**แก้ไข:**
1. ตรวจสอบว่า cookies ถูก set หรือไม่
2. ตรวจสอบว่า `NEXTAUTH_SECRET` ถูกตั้งค่าใน production
3. ตรวจสอบ MongoDB connection

### ปัญหา: Redirect ไม่ทำงาน

**แก้ไข:**
1. ตรวจสอบ `NEXTAUTH_URL` ว่าตรงกับ production URL หรือไม่
2. ตรวจสอบ redirect callback ใน `auth.ts`
3. ตรวจสอบ middleware configuration

---

## 📝 Checklist ก่อน Deploy

- [ ] ตั้งค่า Environment Variables ทั้งหมดใน production platform
- [ ] ตั้งค่า `NEXTAUTH_URL` เป็น production URL
- [ ] ตั้งค่า MongoDB Network Access ให้อนุญาต production IPs
- [ ] ทดสอบ login ใน production
- [ ] ตรวจสอบ cookies ว่าถูก set ถูกต้อง
- [ ] ทดสอบ API calls ว่าทำงานได้
- [ ] ตรวจสอบ security headers

---

## 🔗 Links ที่เป็นประโยชน์

- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

