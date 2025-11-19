# 🔍 คู่มือตรวจสอบปัญหา Login และ Redirect

## ขั้นตอนการตรวจสอบ

### 1. ตรวจสอบ Cookie ใน DevTools

1. เปิด DevTools (F12 หรือ Right-click > Inspect)
2. ไปที่แท็บ **Application** (หรือ Storage ใน Firefox)
3. ด้านซ้าย คลิก **Cookies** > `http://localhost:3000`
4. ตรวจสอบว่ามี cookie ต่อไปนี้หรือไม่:
   - `next-auth.session-token` (สำหรับ HTTP)
   - `__Secure-next-auth.session-token` (สำหรับ HTTPS)
   - `__Host-next-auth.session-token` (สำหรับ HTTPS + SameSite)

**ถ้าไม่มี cookie:**
- NextAuth ไม่ได้ set cookie หลัง login
- ตรวจสอบ `NEXTAUTH_SECRET` ใน `.env.local`
- Restart dev server หลังจากแก้ไข `.env.local`

### 2. ตรวจสอบ Environment Variables

ตรวจสอบไฟล์ `.env.local` ในโฟลเดอร์หลักของโปรเจค:

```env
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=management_app
NEXTAUTH_SECRET=your-secret-here-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000
```

**สำคัญ:**
- `NEXTAUTH_SECRET` ต้องมีอย่างน้อย 32 ตัวอักษร
- `NEXTAUTH_URL` ต้องตรงกับ URL ที่ใช้ (http://localhost:3000)
- หลังจากแก้ไข `.env.local` ต้อง **restart dev server**

### 3. ตรวจสอบ Console Logs

หลังจาก login ให้ดู Console (F12 > Console tab) ว่ามี log อะไร:

- `✅ Login successful! Checking cookies...` - Login สำเร็จ
- `All cookies: ...` - แสดง cookies ทั้งหมด
- `Session cookie found: Yes/No` - พบ session cookie หรือไม่
- `✅ Session cookie exists, redirecting...` - พบ cookie และกำลัง redirect
- `⚠️ Session cookie not found, waiting...` - ไม่พบ cookie กำลังรอ

### 4. ตรวจสอบ Network Requests

1. เปิด DevTools > Network tab
2. Login แล้วดู request ไปที่ `/api/auth/callback/credentials`
3. ตรวจสอบว่า:
   - Status code เป็น `200` หรือ `302` (redirect)
   - Response headers มี `Set-Cookie` หรือไม่

### 5. ตรวจสอบ NextAuth Configuration

ตรวจสอบไฟล์ `src/lib/auth.ts`:
- มี `redirect` callback หรือไม่
- `secret` ถูกตั้งค่าถูกต้องหรือไม่

### 6. ตรวจสอบ Middleware

ตรวจสอบไฟล์ `middleware.ts`:
- Middleware อนุญาตให้เข้าถึง `/dashboard` หรือไม่
- Token ถูกตรวจสอบถูกต้องหรือไม่

## วิธีแก้ไขปัญหา

### ปัญหา: Cookie ไม่ถูก set

**แก้ไข:**
1. ตรวจสอบ `NEXTAUTH_SECRET` ใน `.env.local`
2. สร้าง secret ใหม่: https://generate-secret.vercel.app/32
3. Restart dev server
4. ลบ cookies ทั้งหมดใน DevTools > Application > Cookies
5. Login ใหม่

### ปัญหา: Redirect ไม่ทำงาน

**แก้ไข:**
1. ตรวจสอบ Console logs
2. ตรวจสอบว่า cookie ถูก set หรือไม่
3. ตรวจสอบ middleware ว่า block การ redirect หรือไม่
4. ลองใช้ `window.location.replace("/dashboard")` แทน `window.location.href`

### ปัญหา: 401 Unauthorized

**แก้ไข:**
1. ตรวจสอบว่า session cookie ถูก set หรือไม่
2. ตรวจสอบ middleware ว่า token ถูกตรวจสอบถูกต้องหรือไม่
3. ตรวจสอบ NextAuth configuration
4. Restart dev server

## สร้าง NEXTAUTH_SECRET ใหม่

```bash
# ใช้ openssl (Mac/Linux)
openssl rand -base64 32

# หรือใช้ Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

หรือไปที่: https://generate-secret.vercel.app/32

## ตรวจสอบว่า Environment Variables ถูกโหลดหรือไม่

สร้างไฟล์ `src/app/debug-env/page.tsx` (ชั่วคราว):

```tsx
export default function DebugEnv() {
  return (
    <div>
      <h1>Environment Variables</h1>
      <p>NEXTAUTH_SECRET: {process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Not set'}</p>
      <p>NEXTAUTH_URL: {process.env.NEXTAUTH_URL || 'Not set'}</p>
    </div>
  );
}
```

**หมายเหตุ:** อย่าลืมลบไฟล์นี้หลังจากตรวจสอบเสร็จ!

