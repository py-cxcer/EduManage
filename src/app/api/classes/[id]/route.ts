import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../Model/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log("Fetching class with ID:", id);

    const classItem = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        capacity: true,
        grade: {
          select: {
            level: true,
          },
        },
        supervisor: {
          select: {
            name: true,
            surname: true,
          },
        },
      },
    });

    if (!classItem) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(classItem);
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { error: "Failed to fetch class" },
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
    console.log("Deleting class with ID:", id);

    // First check if the class exists
    const classItem = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
      },
    });

    if (!classItem) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Check if class has any students
    const students = await prisma.student.findMany({
      where: { classId: parseInt(id) },
    });

    if (students.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete class. It has students enrolled. Please reassign or remove the students first.",
        },
        { status: 400 }
      );
    }

    // Check if class has any lessons
    const lessons = await prisma.lesson.findMany({
      where: { classId: parseInt(id) },
    });

    if (lessons.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete class. It has lessons assigned. Please delete the lessons first.",
        },
        { status: 400 }
      );
    }

    // Delete the class
    await prisma.class.delete({
      where: { id: parseInt(id) },
    });

    console.log("Class deleted successfully:", id);
    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
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
    const { name, capacity, gradeLevel, supervisorId } = body || {};

    // Normalize: extract digits as grade level and letters as section (class name)
    let derivedLevel: number | null = null;
    let normalizedName: string | undefined = undefined;
    if (typeof name === "string") {
      const trimmed = name.trim();
      const digitsMatch = trimmed.match(/^(\d{1,2})/);
      const lettersMatch = trimmed.match(/([A-Za-z]+)$/);
      if (!gradeLevel && digitsMatch) {
        derivedLevel = parseInt(digitsMatch[1], 10);
      }
      if (lettersMatch) {
        normalizedName = lettersMatch[1].toUpperCase();
      } else if (trimmed) {
        normalizedName = trimmed.toUpperCase();
      }
    }

    // Find grade by level (1-10) or create if missing
    const targetLevel = Number(gradeLevel) || derivedLevel || 1;
    let grade = await prisma.grade.findUnique({
      where: { level: targetLevel },
    });
    if (!grade) {
      grade = await prisma.grade.create({
        data: { level: targetLevel },
      });
    }

    const updated = await prisma.class.update({
      where: { id: parseInt(id) },
      data: {
        name: normalizedName ?? (typeof name === "string" ? name : undefined),
        capacity: typeof capacity === "number" ? capacity : undefined,
        grade: grade ? { connect: { id: grade.id } } : undefined,
        supervisor: supervisorId
          ? { connect: { id: String(supervisorId) } }
          : { disconnect: true },
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        grade: { select: { level: true } },
        supervisor: { select: { name: true, surname: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating class:", error);
    // Handle unique constraint violation clearly
    if ((error as any)?.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "A class with this grade and section already exists. Choose a different section or grade.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
  }
}
