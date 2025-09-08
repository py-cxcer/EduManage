import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching all exams");

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
    const totalItems = await prisma.exam.count({
      where: searchConditions,
    });
    const totalPages = Math.ceil(totalItems / limit);

    // If TEACHER, scope to their lessons; if STUDENT, scope to their class
    let teacherScope: any = {};
    let classScopeForStudent: any = {};
    try {
      const session = (await getServerSession(authOptions as any)) as any;
      if (session?.user?.role === "TEACHER") {
        teacherScope.teacherId = String(session.user.id);
      } else if (
        session?.user?.role === "STUDENT" ||
        session?.user?.role === "PARENT"
      ) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { username: true },
        });
        if (user?.username) {
          if (session.user.role === "STUDENT") {
            const student = await prisma.student.findUnique({
              where: { username: user.username },
              select: { classId: true },
            });
            if (student?.classId) {
              classScopeForStudent = {
                OR: [
                  { classId: student.classId },
                  { lesson: { classes: { some: { id: student.classId } } } },
                ],
              } as any;
            }
          } else {
            const parent = await prisma.parent.findUnique({
              where: { username: user.username },
              select: { id: true },
            });
            if (parent?.id) {
              const children = await prisma.student.findMany({
                where: { parentId: parent.id },
                select: { classId: true },
              });
              const clsIds = children
                .map((c) => c.classId)
                .filter(Boolean) as number[];
              if (clsIds.length) {
                classScopeForStudent = {
                  OR: [
                    { classId: { in: clsIds } },
                    { lesson: { classes: { some: { id: { in: clsIds } } } } },
                  ],
                } as any;
              }
            }
          }
        }
      }
    } catch {}

    const exams = await prisma.exam.findMany({
      where: {
        ...searchConditions,
        ...classScopeForStudent,
        lesson: {
          ...teacherScope,
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
        startTime: true,
        endTime: true,
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
        startTime: "asc",
      },
      skip: skip,
      take: limit,
    });

    // Transform the data to include subject name, class name, teacher name, and formatted date
    const examsWithDetails = exams.map((exam) => {
      const allClasses = exam.lesson.classes || [];
      const chosen = exam.classId
        ? allClasses.find((c: any) => c.id === exam.classId)
        : null;
      const classLabel = chosen
        ? `${chosen.grade.level}${chosen.name}`
        : allClasses
            .map((cls: any) => `${cls.grade.level}${cls.name}`)
            .join(", ");
      return {
        id: exam.id,
        title: exam.title,
        lessonId: exam.lesson.id,
        subjectName: exam.lesson.subject.name,
        className: classLabel,
        teacherName: `${exam.lesson.teacher.name} ${exam.lesson.teacher.surname}`,
        startTime: exam.startTime,
        endTime: exam.endTime,
        formattedDate: new Date(exam.startTime).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
        }),
      };
    });

    return NextResponse.json({
      exams: examsWithDetails,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Create the exam
    const createData: any = {
      title,
      startTime: new Date(date),
      endTime: new Date(date),
      lessonId,
    };
    if (classId !== undefined)
      createData.classId = classId ? Number(classId) : null;

    let exam;
    try {
      exam = await prisma.exam.create({
        data: createData,
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
    } catch (e: any) {
      // Fallback for deployments where prisma client hasn't been regenerated with classId yet
      if (createData.classId !== undefined) {
        try {
          const { classId: _omit, ...withoutClass } = createData;
          exam = await prisma.exam.create({
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

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error("Error creating exam:", error);
    return NextResponse.json(
      { error: "Failed to create exam" },
      { status: 500 }
    );
  }
}
