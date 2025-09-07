import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../Model/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log("Fetching subject with ID:", id);

    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        teachers: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json(subject);
  } catch (error) {
    console.error("Error fetching subject:", error);
    return NextResponse.json(
      { error: "Failed to fetch subject" },
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
    const { name, teacherIds } = body;

    console.log("Updating subject:", { id, name, teacherIds });

    if (!name) {
      return NextResponse.json(
        { error: "Subject name is required" },
        { status: 400 }
      );
    }

    // First check if the subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Update the subject with new teacher assignments
    const subject = await prisma.subject.update({
      where: { id: parseInt(id) },
      data: {
        name,
        teachers: {
          set: [], // Clear existing relationships
          connect:
            teacherIds && teacherIds.length > 0
              ? teacherIds.map((teacherId: string) => ({ id: teacherId }))
              : [],
        },
      },
      include: {
        teachers: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    return NextResponse.json(subject);
  } catch (error) {
    console.error("Error updating subject:", error);
    return NextResponse.json(
      { error: "Failed to update subject" },
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
    console.log("Deleting subject with ID:", id);

    // First check if the subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if subject has any lessons
    const lessons = await prisma.lesson.findMany({
      where: { subjectId: parseInt(id) },
    });

    if (lessons.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete subject. It has lessons assigned. Please delete the lessons first.",
        },
        { status: 400 }
      );
    }

    // Delete the subject
    await prisma.subject.delete({
      where: { id: parseInt(id) },
    });

    console.log("Subject deleted successfully:", id);
    return NextResponse.json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}
