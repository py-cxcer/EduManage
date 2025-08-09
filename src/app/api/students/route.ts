import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

// Utility function to get next student ID
async function getNextStudentId(): Promise<string> {
  const lastStudent = await prisma.student.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });

  if (!lastStudent) {
    return "S001";
  }

  // Check if the ID is already in the correct format (S001, S002, etc.)
  if (lastStudent.id.startsWith("S")) {
    const lastNumber = parseInt(lastStudent.id.substring(1));
    const nextNumber = lastNumber + 1;
    return `S${nextNumber.toString().padStart(3, "0")}`;
  }

  // If the ID is not in the correct format, start from S001
  return "S001";
}

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching all students");
    const students = await prisma.student.findMany({
      include: {
        grade: true,
        parent: true,
        class: true,
      },
    });
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    console.log("Creating student with data:", body);

    const {
      username,
      password,
      name,
      surname,
      email,
      phone,
      address,
      bloodType,
      sex,
      birthday,
      parentId,
      classId,
      gradeId,
    } = body;

    // Normalize optional unique fields
    const normalizedEmail = email && email.trim() !== "" ? email.trim() : null;
    const normalizedPhone = phone && phone.trim() !== "" ? phone.trim() : null;

    // Pre-check username uniqueness
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists. Choose another." },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate formatted student ID
    const studentId = await getNextStudentId();

    // Create default parent, grade, and class if they don't exist
    const parent = await prisma.parent.upsert({
      where: { id: parentId || "defaultParent" },
      create: {
        id: parentId || "defaultParent",
        username: "defaultParent",
        name: "Default",
        surname: "Parent",
        email: "default@example.com",
        phone: "123-456-7890",
        address: "Default Address",
      },
      update: {},
    });

    const grade = await prisma.grade.upsert({
      where: { id: gradeId || 1 },
      create: {
        id: gradeId || 1,
        level: 1,
      },
      update: {},
    });

    const classRecord = await prisma.class.upsert({
      where: { id: classId || 1 },
      create: {
        id: classId || 1,
        name: "Default Class",
        capacity: 30,
        gradeId: gradeId || 1,
      },
      update: {},
    });

    // Create the student and user in a transaction
    const student = await prisma.$transaction(async (tx) => {
      const createdStudent = await tx.student.create({
        data: {
          id: studentId, // Use the formatted ID as the primary key
          username,
          name,
          surname,
          email: normalizedEmail,
          phone: normalizedPhone,
          address,
          bloodType,
          sex,
          birthday: new Date(birthday),
          parentId: parent.id,
          classId: classRecord.id,
          gradeId: grade.id,
        },
        include: {
          grade: true,
          parent: true,
          class: true,
        },
      });

      await tx.user.create({
        data: {
          id: studentId, // Use the same formatted ID
          username,
          password: hashedPassword,
          role: "STUDENT",
        },
      });

      return createdStudent;
    });

    console.log("Student created successfully:", student);
    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    console.error("Error creating student:", error);
    if (error?.code === "P2002") {
      const target = Array.isArray(error?.meta?.target)
        ? error.meta.target.join(", ")
        : error?.meta?.target || "unique field";
      return NextResponse.json(
        { error: `Conflict: ${target} already exists.` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
