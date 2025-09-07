import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../Model/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exam = await prisma.exam.findUnique({
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

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Transform class display similarly
    const allClasses = exam?.lesson?.classes || [];
    const chosen = (exam as any)?.classId
      ? allClasses.find((c: any) => c.id === (exam as any).classId)
      : null;
    const classLabel = chosen
      ? `${chosen.grade.level}${chosen.name}`
      : allClasses.map((c: any) => `${c.grade.level}${c.name}`).join(", ");

    return NextResponse.json({ ...exam, classLabel });
  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam" },
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
    const { title, date, lessonId, classId } = body;

    // Validate required fields
    if (!title || !date || !lessonId) {
      return NextResponse.json(
        { error: "Title, date, and lesson ID are required" },
        { status: 400 }
      );
    }

    // Validate that the lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        subject: true,
        classes: {
          include: {
            grade: true,
          },
        },
        teacher: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check if exam exists
    const existingExam = await prisma.exam.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!existingExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Update the exam
    const updateData: any = {
      title,
      startTime: new Date(date),
      endTime: new Date(date),
      lessonId,
    };
    if (classId !== undefined)
      updateData.classId = classId ? Number(classId) : null;

    let exam;
    try {
      exam = await prisma.exam.update({
        where: { id: parseInt(params.id) },
        data: updateData,
        include: {
          lesson: {
            include: {
              subject: true,
              classes: { include: { grade: true } },
              teacher: true,
            },
          },
        },
      });
    } catch (e: any) {
      if (updateData.classId !== undefined) {
        try {
          const { classId: _omit, ...withoutClass } = updateData;
          exam = await prisma.exam.update({
            where: { id: parseInt(params.id) },
            data: withoutClass,
            include: {
              lesson: {
                include: {
                  subject: true,
                  classes: { include: { grade: true } },
                  teacher: true,
                },
              },
            },
          });
        } catch (inner) {
          throw e;
        }
      } else {
        throw e;
      }
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Error updating exam:", error);
    return NextResponse.json(
      { error: "Failed to update exam" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exam = await prisma.exam.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Exam deleted successfully" });
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json(
      { error: "Failed to delete exam" },
      { status: 500 }
    );
  }
}
