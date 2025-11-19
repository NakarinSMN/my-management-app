// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, name } = body;

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
        ...(email ? [{ email: email }] : [])
      ]
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Username หรือ Email นี้มีผู้ใช้แล้ว" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้างผู้ใช้ใหม่
    const newUser = {
      username,
      email: email || null,
      password: hashedPassword,
      name: name || username,
      role: "user", // default role
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    };

    const result = await users.insertOne(newUser);

    return NextResponse.json({
      success: true,
      message: "สมัครสมาชิกสำเร็จ",
      userId: result.insertedId.toString()
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการสมัครสมาชิก" },
      { status: 500 }
    );
  }
}

