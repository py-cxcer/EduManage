import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../Model/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        lesson: {
          include: {
            subject: true,
            classes: {
              include: {
                grade: true,
              },
            },
            teacher: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, dueDate, lessonId, classId } = body;

    // Validate required fields (mirror POST behavior)
    if (!title || !dueDate || !lessonId) {
      return NextResponse.json(
        { error: "Title, due date, and lesson are required" },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check if lesson exists and pull related fields
    const lesson = await prisma.lesson.findUnique({
      where: { id: parseInt(lessonId) },
      include: {
        subject: true,
        classes: { include: { grade: true } },
        teacher: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const start = new Date(dueDate);
    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: "Invalid date values" },
        { status: 400 }
      );
    }

    // Choose classId if provided, otherwise keep existing, otherwise default from lesson
    let classIdToSet: number | undefined = undefined;
    if (classId !== undefined) {
      classIdToSet = classId ? Number(classId) : undefined;
    } else if (existingAssignment.classId) {
      classIdToSet = existingAssignment.classId as number;
    } else {
      classIdToSet = lesson.classes?.[0]?.id;
    }
    if (!classIdToSet) {
      return NextResponse.json(
        { error: "Lesson has no associated class to attach to assignment" },
        { status: 400 }
      );
    }

    // Update the assignment (mirror POST: set startDate = dueDate)
    const data: any = {
      title: String(title),
      startDate: start,
      dueDate: start,
      lessonId: parseInt(lessonId),
      classId: classIdToSet,
      subjectId: (lesson as any).subjectId,
      teacherId: (lesson as any).teacherId,
    };

    const assignment = await prisma.assignment.update({
      where: { id: parseInt(params.id) },
      data,
      include: {
        lesson: {
          include: {
            subject: true,
            classes: {
              include: {
                grade: true,
              },
            },
            teacher: true,
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignment = await prisma.assignment.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
