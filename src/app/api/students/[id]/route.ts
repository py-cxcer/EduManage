import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../Model/prisma";

async function resolveStudentByParam(idOrUserId: string) {
  let student = await prisma.student.findUnique({ where: { id: idOrUserId } });
  if (student) return student;

  const user = await prisma.user.findUnique({ where: { id: idOrUserId } });
  if (!user) return null;
  student = await prisma.student.findUnique({
    where: { username: user.username },
  });
  return student;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log("Fetching student with ID:", id);

    const resolved = await resolveStudentByParam(id);
    if (!resolved) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const student = await prisma.student.findUnique({
      where: { id: resolved.id },
      include: { grade: true, parent: true, class: true },
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    console.log("Updating student with ID:", id, "Data:", body);

    const { name, surname, email, phone, address, birthday, sex, bloodType } =
      body;

    // Validate and normalize sex field
    const validSexValues = ["MALE", "FEMALE", "OTHER"];
    const normalizedSex = sex?.toString().toUpperCase();
    if (!normalizedSex || !validSexValues.includes(normalizedSex)) {
      return NextResponse.json(
        { error: "Invalid sex value. Must be MALE, FEMALE, or OTHER." },
        { status: 400 }
      );
    }

    // Resolve student ID from either S### or user cuid
    const existingStudent = await resolveStudentByParam(id);
    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Update student profile
    const updatedStudent = await prisma.student.update({
      where: { id: existingStudent.id },
      data: {
        name,
        surname,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address,
        birthday: new Date(birthday),
        sex: normalizedSex as any, // Use validated and normalized sex
        bloodType,
      },
      include: {
        grade: true,
        parent: true,
        class: true,
      },
    });

    console.log("Student updated successfully:", updatedStudent);
    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log("Deleting student with ID:", id);

    const student = await resolveStudentByParam(id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Use a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      const studentId = student.id;

      // Delete all related records
      await tx.attendance.deleteMany({ where: { studentId } });
      await tx.result.deleteMany({ where: { studentId } });

      // Delete the student record
      await tx.student.delete({ where: { id: studentId } });

      // Try to delete the user record by username
      await tx.user.deleteMany({ where: { username: student.username } });
    });

    return NextResponse.json(
      { message: "Student deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete student",
      },
      { status: 500 }
    );
  }
}
