import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../Model/prisma";

async function resolveTeacherByParam(idOrUserId: string) {
  console.log("Resolving teacher for param:", idOrUserId);

  // Try direct teacher ID first (e.g., T001)
  let teacher = await prisma.teacher.findUnique({ where: { id: idOrUserId } });
  if (teacher) {
    console.log("Found teacher by direct ID:", teacher.id);
    return teacher;
  }

  // Fallback: treat as a User ID and look up by username
  console.log("Teacher not found by direct ID, trying User lookup...");
  const user = await prisma.user.findUnique({ where: { id: idOrUserId } });
  if (!user) {
    console.log("User not found for ID:", idOrUserId);
    return null;
  }

  console.log(
    "Found user:",
    user.username,
    "looking for teacher with same username..."
  );
  teacher = await prisma.teacher.findUnique({
    where: { username: user.username },
  });

  if (teacher) {
    console.log("Found teacher by username:", teacher.id);
  } else {
    console.log("No teacher found with username:", user.username);
  }

  return teacher;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log("Fetching teacher with ID:", id);

    const resolved = await resolveTeacherByParam(id);
    if (!resolved) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: resolved.id },
      include: { subjects: true, classes: true },
    });

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher" },
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
    console.log("Updating teacher with ID:", id, "Data:", body);

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

    // Resolve teacher ID from either T### or user cuid
    const existingTeacher = await resolveTeacherByParam(id);
    if (!existingTeacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Update teacher profile
    const updatedTeacher = await prisma.teacher.update({
      where: { id: existingTeacher.id },
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
        subjects: true,
        classes: true,
      },
    });

    console.log("Teacher updated successfully:", updatedTeacher);
    return NextResponse.json(updatedTeacher);
  } catch (error) {
    console.error("Error updating teacher:", error);
    return NextResponse.json(
      { error: "Failed to update teacher" },
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
    console.log("Deleting teacher with ID:", id);

    const teacher = await resolveTeacherByParam(id);
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Use a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      const teacherId = teacher.id;

      // Delete all related records
      await tx.attendance.deleteMany({
        where: { lesson: { teacherId } },
      });

      await tx.result.deleteMany({
        where: { exam: { lesson: { teacherId } } },
      });

      await tx.result.deleteMany({
        where: { assignment: { lesson: { teacherId } } },
      });

      await tx.exam.deleteMany({
        where: { lesson: { teacherId } },
      });

      await tx.assignment.deleteMany({
        where: { lesson: { teacherId } },
      });

      await tx.lesson.deleteMany({ where: { teacherId } });

      // Clear supervisor references
      await tx.class.updateMany({
        where: { supervisorId: teacherId },
        data: { supervisorId: null },
      });

      // Delete the teacher record
      await tx.teacher.delete({ where: { id: teacherId } });

      // Try to delete the user record by username
      await tx.user.deleteMany({ where: { username: teacher.username } });
    });

    return NextResponse.json(
      { message: "Teacher deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete teacher",
      },
      { status: 500 }
    );
  }
}
