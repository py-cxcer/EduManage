import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";
import { syncTeacherClasses } from "../../../lib/teacherClassSync";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subjectId, classIds, teacherId } = body;

    console.log("Creating lesson:", {
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

    // Check for duplicate classes with the same subject and teacher
    const existingLessons = await prisma.lesson.findMany({
      where: {
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
              .join(", ")} are already assigned to this subject and teacher`,
          },
          { status: 400 }
        );
      }
    }

    // Create the lesson and update teacher-class relationships
    const lesson = await prisma.$transaction(async (tx) => {
      // Create the lesson
      const newLesson = await tx.lesson.create({
        data: {
          subjectId: parseInt(subjectId),
          teacherId,
          classes: {
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

      // Sync teacher classes based on all their lessons
      await syncTeacherClasses(teacherId, tx);

      return newLesson;
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching all lessons");

    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const subjectIdParam = searchParams.get("subjectId");
    const teacherIdParam = searchParams.get("teacherId");
    const classIdParam = searchParams.get("classId");
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalItems = await prisma.lesson.count();
    const totalPages = Math.ceil(totalItems / limit);

    const lessons = await prisma.lesson.findMany({
      where: {
        ...(subjectIdParam ? { subjectId: Number(subjectIdParam) } : {}),
        ...(teacherIdParam ? { teacherId: teacherIdParam as string } : {}),
        ...(classIdParam
          ? { classes: { some: { id: Number(classIdParam) } } }
          : {}),
      },
      select: {
        id: true,
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
      orderBy: {
        id: "asc",
      },
      skip: skip,
      take: limit,
    });

    // Transform the data to include subject name, class names, and teacher name
    const lessonsWithDetails = lessons.map((lesson: any) => ({
      id: lesson.id,
      subjectName: lesson.subject.name,
      className: lesson.classes
        .map((cls: any) => `${cls.grade.level}${cls.name}`)
        .join(", "),
      teacherName: `${lesson.teacher.name} ${lesson.teacher.surname}`,
      classes: lesson.classes,
      subjectId: lesson.subjectId,
      teacherId: lesson.teacherId,
    }));

    return NextResponse.json({
      lessons: lessonsWithDetails,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}
