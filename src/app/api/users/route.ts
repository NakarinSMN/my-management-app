// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

interface UserDocument {
  _id: { toString(): string };
  username: string;
  email?: string;
  name: string;
  role: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date | null;
}

interface UserResponse {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date | null;
}

// GET: ดึงข้อมูล users ทั้งหมด
export async function GET() {
  try {
    const db = await getDatabase();
    const users = db.collection("users");

    // ดึงข้อมูล users ทั้งหมด (ไม่รวม password)
    const allUsers = await users.find({}).toArray();

    // ลบ password ออกจากข้อมูล
    const usersWithoutPassword: UserResponse[] = allUsers.map((user) => {
      const userDoc = user as unknown as UserDocument;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userWithoutPassword } = userDoc;
      return {
        ...userWithoutPassword,
        id: userDoc._id.toString(),
      } as UserResponse;
    });

    return NextResponse.json({
      success: true,
      data: usersWithoutPassword,
      count: usersWithoutPassword.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}

// POST: สร้าง user ใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, name, role } = body;

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username และ Password จำเป็นต้องกรอก" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password ต้องมีอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const users = db.collection("users");

    // ตรวจสอบว่ามี username หรือ email ซ้ำหรือไม่
    const existingUser = await users.findOne({
      $or: [
        { username: username },
        ...(email ? [{ email: email }] : []),
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Username หรือ Email นี้มีผู้ใช้แล้ว" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้าง user ใหม่
    const newUser = {
      username,
      email: email || null,
      password: hashedPassword,
      name: name || username,
      role: role || "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    };

    const result = await users.insertOne(newUser);

    // ลบ password ออกจาก response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...userWithoutPassword,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create user",
      },
      { status: 500 }
    );
  }
}

