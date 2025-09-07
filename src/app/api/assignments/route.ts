import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching all assignments");

    // Get pagination and search parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const subjectIdParam = searchParams.get("subjectId");
    const teacherIdParam = searchParams.get("teacherId");
    const classIdParam = searchParams.get("classId");
    const skip = (page - 1) * limit;

    // Build search conditions
    const searchConditions = search
      ? {
          OR: [{ title: { contains: search, mode: "insensitive" as const } }],
        }
      : {};

    // Get total count for pagination (with search filter)
    const totalItems = await prisma.assignment.count({
      where: searchConditions,
    });
    const totalPages = Math.ceil(totalItems / limit);

    const assignments = await prisma.assignment.findMany({
      where: {
        ...searchConditions,
        lesson: {
          ...(subjectIdParam ? { subjectId: Number(subjectIdParam) } : {}),
          ...(teacherIdParam ? { teacherId: teacherIdParam as string } : {}),
          ...(classIdParam
            ? { classes: { some: { id: Number(classIdParam) } } }
            : {}),
        },
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        dueDate: true,
        classId: true,
        lessonId: true, // Add lessonId to select
        lesson: {
          select: {
            id: true, // Add lesson id to select
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
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      skip: skip,
      take: limit,
    });

    // Transform the data to include subject name, class name, teacher name, and formatted due date
    const assignmentsWithDetails = assignments.map((assignment) => {
      const classes = assignment.lesson?.classes || [];
      const chosen = assignment.classId
        ? classes.find((c: any) => c.id === assignment.classId)
        : null;
      const classLabel = chosen
        ? `${chosen.grade.level}${chosen.name}`
        : classes.length > 0
        ? classes.map((cls: any) => `${cls.grade.level}${cls.name}`).join(", ")
        : "No Class";
      return {
        id: assignment.id,
        title: assignment.title,
        lessonId: assignment.lessonId,
        subjectName: assignment.lesson?.subject?.name || "Unknown Subject",
        className: classLabel,
        teacherName: assignment.lesson?.teacher
          ? `${assignment.lesson.teacher.name} ${assignment.lesson.teacher.surname}`
          : "Unknown Teacher",
        startDate: assignment.startDate,
        dueDate: assignment.dueDate,
        formattedDueDate: new Date(assignment.dueDate).toLocaleDateString(
          "en-GB",
          { day: "numeric", month: "numeric", year: "numeric" }
        ),
      };
    });

    return NextResponse.json({
      assignments: assignmentsWithDetails,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, dueDate, lessonId, classId } = body;

    // Validate required fields
    if (!title || !dueDate || !lessonId) {
      return NextResponse.json(
        { error: "Title, due date, and lesson are required" },
        { status: 400 }
      );
    }

    // Coerce and validate inputs
    const lessonIdInt =
      typeof lessonId === "string" ? parseInt(lessonId, 10) : Number(lessonId);
    const due = new Date(dueDate);

    if (!Number.isInteger(lessonIdInt) || Number.isNaN(lessonIdInt)) {
      return NextResponse.json({ error: "Invalid lessonId" }, { status: 400 });
    }

    if (isNaN(due.getTime())) {
      return NextResponse.json(
        { error: "Invalid date values" },
        { status: 400 }
      );
    }

    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonIdInt },
      include: {
        subject: { select: { name: true } },
        classes: {
          select: { id: true, name: true, grade: { select: { level: true } } },
        },
        teacher: { select: { name: true, surname: true } },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Create the assignment
    // Choose a concrete classId from the lesson's classes to satisfy DB constraint
    const classIdForAssignment = lesson.classes?.[0]?.id;
    if (!classIdForAssignment) {
      return NextResponse.json(
        { error: "Lesson has no associated class to attach to assignment" },
        { status: 400 }
      );
    }

    const data: any = {
      title: String(title),
      startDate: due,
      dueDate: due,
      lessonId: lessonIdInt,
      classId: classId ? Number(classId) : classIdForAssignment,
      subjectId: lesson.subjectId,
      teacherId: lesson.teacherId,
    };

    const assignment = await prisma.assignment.create({
      data,
      include: {
        lesson: {
          select: {
            subject: { select: { name: true } },
            classes: {
              select: {
                id: true,
                name: true,
                grade: { select: { level: true } },
              },
            },
            teacher: { select: { name: true, surname: true } },
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error: any) {
    console.error("Error creating assignment:", error);
    const message =
      error?.meta?.cause || error?.message || "Failed to create assignment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
