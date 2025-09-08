import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../Model/prisma";
import {
  syncTeacherClasses,
  verifyTeacherClassSync,
} from "../../../../lib/teacherClassSync";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log("Fetching lesson with ID:", id);

    const lesson = await prisma.lesson.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        subjectId: true,
        subject: {
          select: {
            name: true,
          },
        },
        classes: {
          select: {
            id: true,
            name: true,
            grade: {
              select: {
                level: true,
              },
            },
          },
        },
        teacherId: true,
        teacher: {
          select: {
            name: true,
            surname: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
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
    const {
      subjectId,
      classIds,
      teacherId,
      startAt,
      endAt,
      dayOfWeek,
      startTime,
      endTime,
    } = body;

    console.log("Updating lesson:", {
      id,
      subjectId,
      classIds,
      teacherId,
    });

    if (!subjectId || !teacherId) {
      return NextResponse.json(
        { error: "Subject and teacher must be provided" },
        { status: 400 }
      );
    }

    if (!classIds || classIds.length === 0) {
      return NextResponse.json(
        { error: "At least one class must be selected" },
        { status: 400 }
      );
    }

    // First check if the lesson exists
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check for duplicate classes in other lessons with the same subject and teacher
    const existingLessons = await prisma.lesson.findMany({
      where: {
        id: { not: parseInt(id) }, // Exclude current lesson
        subjectId: parseInt(subjectId),
        teacherId,
        classes: {
          some: {
            id: {
              in: classIds,
            },
          },
        },
      },
      include: {
        classes: true,
      },
    });

    if (existingLessons.length > 0) {
      const duplicateClasses = existingLessons.flatMap((lesson) =>
        lesson.classes.filter((cls) => classIds.includes(cls.id))
      );
      if (duplicateClasses.length > 0) {
        return NextResponse.json(
          {
            error: `Classes ${duplicateClasses
              .map((c) => c.name)
              .join(
                ", "
              )} are already assigned to another lesson with the same subject and teacher`,
          },
          { status: 400 }
        );
      }
    }

    // Update the lesson and sync teacher-class relationships
    const lesson = await prisma.$transaction(async (tx) => {
      // Get the current lesson to check if teacher changed
      const currentLesson = await tx.lesson.findUnique({
        where: { id: parseInt(id) },
        select: { teacherId: true },
      });

      console.log("Updating lesson:", {
        lessonId: id,
        currentTeacherId: currentLesson?.teacherId,
        newTeacherId: teacherId,
        classIds: classIds,
        teacherChanged: currentLesson?.teacherId !== teacherId,
      });

      // Update the lesson
      const updatedLesson = await tx.lesson.update({
        where: { id: parseInt(id) },
        data: {
          subjectId: parseInt(subjectId),
          teacherId,
          ...(startAt !== undefined
            ? { startAt: startAt ? new Date(startAt) : null }
            : {}),
          ...(endAt !== undefined
            ? { endAt: endAt ? new Date(endAt) : null }
            : {}),
          ...(dayOfWeek !== undefined
            ? { dayOfWeek: dayOfWeek !== null ? Number(dayOfWeek) : null }
            : {}),
          ...(startTime !== undefined ? { startTime: startTime || null } : {}),
          ...(endTime !== undefined ? { endTime: endTime || null } : {}),
          ...((body as any).days !== undefined
            ? {
                daysJson: Array.isArray((body as any).days)
                  ? (body as any).days
                  : null,
              }
            : {}),
          classes: {
            set: [], // Clear existing relationships
            connect: classIds.map((id: number) => ({ id })),
          },
        },
        include: {
          subject: {
            select: {
              name: true,
            },
          },
          classes: {
            select: {
              id: true,
              name: true,
              grade: {
                select: {
                  level: true,
                },
              },
            },
          },
          teacher: {
            select: {
              name: true,
              surname: true,
            },
          },
        },
      });

      console.log("Lesson updated successfully:", {
        lessonId: updatedLesson.id,
        subject: updatedLesson.subject.name,
        teacher: `${updatedLesson.teacher.name} ${updatedLesson.teacher.surname}`,
        classes: updatedLesson.classes.map(
          (cls: any) => `${cls.grade.level}${cls.name}`
        ),
      });

      // Sync classes for the current teacher
      console.log(`Syncing classes for new teacher: ${teacherId}`);
      await syncTeacherClasses(teacherId, tx);

      // If teacher changed, sync classes for the old teacher as well
      if (currentLesson && currentLesson.teacherId !== teacherId) {
        console.log(
          `Teacher changed, syncing classes for old teacher: ${currentLesson.teacherId}`
        );
        await syncTeacherClasses(currentLesson.teacherId, tx);
      }

      // Verify the sync worked correctly
      const verificationResult = await verifyTeacherClassSync(tx);
      if (verificationResult.issuesFound > 0) {
        console.warn(
          "Sync verification found issues after lesson update:",
          verificationResult.issues
        );
      }

      return updatedLesson;
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
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
    console.log("Deleting lesson with ID:", id);

    // First check if the lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check if lesson has any exams or assignments
    const exams = await prisma.exam.findMany({
      where: { lessonId: parseInt(id) },
    });

    const assignments = await prisma.assignment.findMany({
      where: { lessonId: parseInt(id) },
    });

    if (exams.length > 0 || assignments.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete lesson. It has exams or assignments. Please delete them first.",
        },
        { status: 400 }
      );
    }

    // Delete the lesson and update teacher-class relationships
    await prisma.$transaction(async (tx) => {
      // Get the lesson to find the teacher
      const lessonToDelete = await tx.lesson.findUnique({
        where: { id: parseInt(id) },
        select: { teacherId: true },
      });

      if (!lessonToDelete) {
        throw new Error("Lesson not found");
      }

      // Delete the lesson
      await tx.lesson.delete({
        where: { id: parseInt(id) },
      });

      // Sync classes for the teacher after deletion
      await syncTeacherClasses(lessonToDelete.teacherId, tx);
    });

    console.log("Lesson deleted successfully:", id);
    return NextResponse.json({ message: "Lesson deleted successfully" });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
