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
    const { title, startDate, dueDate, lessonId, classId } = body;

    // Validate required fields
    if (!title || !startDate || !dueDate || !lessonId) {
      return NextResponse.json(
        { error: "Title, start date, due date, and lesson are required" },
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

    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: parseInt(lessonId) },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Update the assignment
    const data: any = {
      title: String(title),
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
      lessonId: parseInt(lessonId),
    };
    if (classId !== undefined) data.classId = classId ? Number(classId) : null;

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
