// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

interface UserDocument {
  _id: ObjectId;
  username: string;
  email?: string | null;
  name: string;
  role: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date | null;
}

interface UpdateData {
  updatedAt: Date;
  username?: string;
  email?: string | null;
  name?: string;
  role?: string;
  password?: string;
}

// PUT: อัปเดต user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, email, password, name, role } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const users = db.collection("users");

    // ตรวจสอบว่ามี user นี้หรือไม่
    const existingUser = await users.findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // ตรวจสอบว่ามี username หรือ email ซ้ำหรือไม่ (ยกเว้น user เดิม)
    if (username || email) {
      const duplicateUser = await users.findOne({
        _id: { $ne: new ObjectId(id) },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
        ],
      });

      if (duplicateUser) {
        return NextResponse.json(
          { success: false, error: "Username หรือ Email นี้มีผู้ใช้แล้ว" },
          { status: 400 }
        );
      }
    }

    // เตรียมข้อมูลสำหรับอัปเดต
    const updateData: UpdateData = {
      updatedAt: new Date(),
    };

    if (username) updateData.username = username;
    if (email !== undefined) updateData.email = email || null;
    if (name) updateData.name = name;
    if (role) updateData.role = role;

    // ถ้ามี password ใหม่ ให้ hash
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: "Password ต้องมีอย่างน้อย 6 ตัวอักษร" },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // อัปเดต user
    const result = await users.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // ดึงข้อมูล user ที่อัปเดตแล้ว
    const updatedUser = await users.findOne({ _id: new ObjectId(id) }) as UserDocument | null;
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser._id.toString(),
        ...userWithoutPassword,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user",
      },
      { status: 500 }
    );
  }
}

// DELETE: ลบ user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const users = db.collection("users");

    const result = await users.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete user",
      },
      { status: 500 }
    );
  }
}

