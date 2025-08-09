import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../Model/prisma";

// Helpers to generate formatted IDs consistent with admin-created records
async function getNextTeacherId(): Promise<string> {
  const lastTeacher = await prisma.teacher.findFirst({
    where: { id: { startsWith: "T" } },
    orderBy: { id: "desc" },
    select: { id: true },
  });

  if (!lastTeacher) return "T001";

  const lastNumber = parseInt(lastTeacher.id.slice(1), 10) || 0;
  const nextNumber = lastNumber + 1;
  return `T${nextNumber.toString().padStart(3, "0")}`;
}

async function getNextStudentId(): Promise<string> {
  const lastStudent = await prisma.student.findFirst({
    where: { id: { startsWith: "S" } },
    orderBy: { id: "desc" },
    select: { id: true },
  });

  if (!lastStudent) return "S001";

  const lastNumber = parseInt(lastStudent.id.slice(1), 10) || 0;
  const nextNumber = lastNumber + 1;
  return `S${nextNumber.toString().padStart(3, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, role } = await request.json();

    // Validate input
    if (!username || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const upperRole = String(role).toUpperCase();

    // Create user and a matching domain profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          role: upperRole as any,
        },
      });

      // Create corresponding domain profile so the dashboard profile works immediately
      if (upperRole === "TEACHER") {
        const teacherId = await getNextTeacherId();
        await tx.teacher.create({
          data: {
            // Use formatted Teacher ID to match admin-created records
            id: teacherId,
            username: user.username,
            name: "New",
            surname: "Teacher",
            email: null,
            phone: null,
            address: "Not set",
            bloodType: "Unknown",
            sex: "MALE",
            birthday: new Date("2000-01-01"),
          },
        });
      } else if (upperRole === "STUDENT") {
        // Ensure defaults for required relations
        const parent = await tx.parent.upsert({
          where: { id: "defaultParent" },
          create: {
            id: "defaultParent",
            username: "defaultParent",
            name: "Default",
            surname: "Parent",
            email: "default@example.com",
            phone: "123-456-7890",
            address: "Default Address",
          },
          update: {},
        });

        const grade = await tx.grade.upsert({
          where: { id: 1 },
          create: { id: 1, level: 1 },
          update: {},
        });

        const classRecord = await tx.class.upsert({
          where: { id: 1 },
          create: {
            id: 1,
            name: "Default Class",
            capacity: 30,
            gradeId: grade.id,
          },
          update: {},
        });

        const studentId = await getNextStudentId();
        await tx.student.create({
          data: {
            // Use formatted Student ID to match admin-created records
            id: studentId,
            username: user.username,
            name: "New",
            surname: "Student",
            email: null,
            phone: null,
            address: "Not set",
            bloodType: "Unknown",
            sex: "MALE",
            birthday: new Date("2005-01-01"),
            parentId: parent.id,
            classId: classRecord.id,
            gradeId: grade.id,
          },
        });
      }

      const { password: _pw, ...userWithoutPassword } = user as any;
      return userWithoutPassword;
    });

    return NextResponse.json(
      { message: "User created successfully", user: result },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
