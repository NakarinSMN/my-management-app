# 🔐 คู่มือการตั้งค่าระบบล็อกอิน

## 📋 สรุประบบ

ระบบล็อกอินใช้ **NextAuth.js** ร่วมกับ **MongoDB** สำหรับเก็บข้อมูลผู้ใช้

### Features:
- ✅ Login ด้วย Username/Email + Password
- ✅ Session Management (JWT)
- ✅ Route Protection (Middleware)
- ✅ API Route Protection
- ✅ User Context/Hook
- ✅ Auto Logout เมื่อ session หมดอายุ

---

## 🚀 ขั้นตอนการตั้งค่า

### 1. ติดตั้ง Dependencies
```bash
npm install next-auth@beta bcryptjs @types/bcryptjs
```

### 2. ตั้งค่า Environment Variables

แก้ไขไฟล์ `.env.local`:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=management_app

# NextAuth Secret (ใช้สำหรับเข้ารหัส session)
# สร้าง secret ได้ที่: https://generate-secret.vercel.app/32
# หรือใช้คำสั่ง: openssl rand -base64 32
NEXTAUTH_SECRET=your-nextauth-secret-here-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000
```

**สำคัญ:** ต้องสร้าง `NEXTAUTH_SECRET` ที่เป็น random string ยาวๆ (อย่างน้อย 32 ตัวอักษร)

### 3. สร้าง Admin User

รันคำสั่งนี้เพื่อสร้าง Admin User:

```bash
node scripts/create-admin-user.js
```

หรือสร้างด้วยข้อมูล custom:

```bash
node scripts/create-admin-user.js username password email name
```

**Default Admin:**
- Username: `admin`
- Password: `admin123`
- Email: `admin@example.com`
- Name: `Admin`

⚠️ **สำคัญ:** หลังจากเข้าสู่ระบบครั้งแรก ควรเปลี่ยนรหัสผ่านทันที!

### 4. รัน Application

```bash
npm run dev
```

---

## 📁 โครงสร้างไฟล์

### Authentication Files:
- `src/lib/auth.ts` - NextAuth configuration
- `src/lib/api-auth.ts` - Helper functions สำหรับ protect API routes
- `src/app/contexts/AuthContext.tsx` - Auth context และ hook
- `src/app/login/page.tsx` - หน้าล็อกอิน
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `src/app/api/auth/register/route.ts` - API สำหรับสมัครสมาชิก
- `src/app/api/auth/me/route.ts` - API สำหรับดึงข้อมูล user ปัจจุบัน
- `middleware.ts` - Middleware สำหรับ protect routes

### Scripts:
- `scripts/create-admin-user.js` - Script สำหรับสร้าง Admin User

---

## 🔒 การใช้งาน

### Frontend - ใช้ useAuth Hook

```typescript
import { useAuth } from "@/app/contexts/AuthContext";

function MyComponent() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <div>กรุณาเข้าสู่ระบบ</div>;
  }

  return (
    <div>
      <p>สวัสดี, {user?.name}!</p>
      <p>Username: {user?.username}</p>
      <p>Role: {user?.role}</p>
      <button onClick={signOut}>ออกจากระบบ</button>
    </div>
  );
}
```

### Backend - Protect API Routes

```typescript
import { requireAuth } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  // Check authentication
  const authSession = await requireAuth(request);
  if (authSession instanceof NextResponse) {
    return authSession; // Return error response (401)
  }

  // User is authenticated, continue...
  const user = authSession.user;
  
  // Your code here...
}
```

### Backend - Require Admin Role

```typescript
import { requireAdmin } from "@/lib/api-auth";

export async function DELETE(request: NextRequest) {
  // Check admin role
  const authSession = await requireAdmin(request);
  if (authSession instanceof NextResponse) {
    return authSession; // Return error response (401 or 403)
  }

  // User is admin, continue...
  // Your code here...
}
```

---

## 🛡️ Route Protection

### Middleware Protection

`middleware.ts` จะ protect ทุก route ยกเว้น:
- `/login` - อนุญาตให้เข้าถึงได้โดยไม่ต้องล็อกอิน
- `/api/auth/*` - NextAuth routes
- Static files (`_next/static`, `_next/image`, etc.)

### Manual Protection

สำหรับ API routes ที่ไม่ต้องการ middleware protection สามารถใช้ `requireAuth` หรือ `requireAdmin` แทน

---

## 📊 User Schema (MongoDB)

```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (optional),
  password: String (hashed with bcrypt),
  name: String,
  role: String (default: "user"), // "user" | "admin"
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date (optional)
}
```

---

## 🔑 Roles

- **user**: ผู้ใช้ทั่วไป
- **admin**: ผู้ดูแลระบบ (มีสิทธิ์พิเศษ)

---

## ⚠️ หมายเหตุ

1. **Password Security**: Passwords ถูก hash ด้วย bcrypt (10 rounds)
2. **Session**: ใช้ JWT token, หมดอายุใน 30 วัน
3. **HTTP-only Cookies**: Session ถูกเก็บใน HTTP-only cookies (ปลอดภัย)
4. **Middleware**: Protect ทุกหน้าโดยอัตโนมัติ ยกเว้น `/login`

---

## 🐛 Troubleshooting

### "NEXTAUTH_SECRET is missing"
- ตรวจสอบว่าได้เพิ่ม `NEXTAUTH_SECRET` ใน `.env.local` แล้ว
- Restart dev server หลังจากเพิ่ม environment variable

### "Unauthorized" error
- ตรวจสอบว่าล็อกอินแล้วหรือยัง
- ตรวจสอบ session ว่ายังไม่หมดอายุ

### ไม่สามารถล็อกอินได้
- ตรวจสอบว่าได้สร้าง user ด้วย `scripts/create-admin-user.js` แล้ว
- ตรวจสอบ username/password ว่าถูกต้อง
- ตรวจสอบ MongoDB connection

---

## 📝 TODO (อนาคต)

- [ ] Change Password
- [ ] Forgot Password / Reset Password
- [ ] Email Verification
- [ ] Two-Factor Authentication (2FA)
- [ ] User Management (Admin panel)
- [ ] Activity Logs

