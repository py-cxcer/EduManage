import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching all results");

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
          OR: [
            // Add search conditions here if needed
          ],
        }
      : {};

    // Get total count for pagination (with search filter)
    const totalItems = await prisma.result.count({ where: searchConditions });
    const totalPages = Math.ceil(totalItems / limit);

    const baseWhere: any = { ...searchConditions };
    if (subjectIdParam) {
      baseWhere.OR = [
        { exam: { lesson: { subjectId: Number(subjectIdParam) } } },
        { assignment: { lesson: { subjectId: Number(subjectIdParam) } } },
      ];
    }
    const typeParam = searchParams.get("assessmentType");
    if (typeParam === "exam") {
      (baseWhere as any).examId = { not: null };
    } else if (typeParam === "assignment") {
      (baseWhere as any).assignmentId = { not: null };
    }
    if (teacherIdParam) {
      baseWhere.AND = [
        ...(baseWhere.AND || []),
        {
          OR: [
            { exam: { lesson: { teacherId: teacherIdParam as string } } },
            { assignment: { lesson: { teacherId: teacherIdParam as string } } },
          ],
        },
      ];
    }
    if (classIdParam) {
      baseWhere.AND = [
        ...(baseWhere.AND || []),
        {
          OR: [
            {
              exam: {
                lesson: { classes: { some: { id: Number(classIdParam) } } },
              },
            },
            {
              assignment: {
                lesson: { classes: { some: { id: Number(classIdParam) } } },
              },
            },
          ],
        },
      ];
    }

    const results = await prisma.result.findMany({
      where: baseWhere,
      select: {
        id: true,
        score: true,
        exam: {
          select: {
            title: true,
            startTime: true,
            lesson: {
              select: {
                subject: {
                  select: {
                    name: true,
                  },
                },
                classes: {
                  select: {
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
        },
        assignment: {
          select: {
            title: true,
            dueDate: true,
            lesson: {
              select: {
                subject: {
                  select: {
                    name: true,
                  },
                },
                classes: {
                  select: {
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
        },
        student: {
          select: {
            name: true,
            surname: true,
            class: {
              select: {
                name: true,
                grade: {
                  select: {
                    level: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        id: "asc",
      },
      skip: skip,
      take: limit,
    });

    // Transform the data to include all required information
    const resultsWithDetails = results
      .map((result) => {
        // Determine if it's an exam or assignment result
        const isExam = result.exam !== null;

        if (isExam && result.exam) {
          return {
            id: result.id,
            score: result.score,
            subjectName: result.exam.lesson.subject.name,
            studentName: `${result.student.name} ${result.student.surname}`,
            className: `${result.student.class.grade.level}${result.student.class.name}`,
            teacherName: `${result.exam.lesson.teacher.name} ${result.exam.lesson.teacher.surname}`,
            assessmentTitle: result.exam.title,
            assessmentDate: result.exam.startTime,
            // Format date as D/M/Y
            formattedDate: new Date(result.exam.startTime).toLocaleDateString(
              "en-GB",
              {
                day: "numeric",
                month: "numeric",
                year: "numeric",
              }
            ),
            type: "Exam" as const,
          };
        } else if (result.assignment) {
          return {
            id: result.id,
            score: result.score,
            subjectName: result.assignment.lesson.subject.name,
            studentName: `${result.student.name} ${result.student.surname}`,
            className: `${result.student.class.grade.level}${result.student.class.name}`,
            teacherName: `${result.assignment.lesson.teacher.name} ${result.assignment.lesson.teacher.surname}`,
            assessmentTitle: result.assignment.title,
            assessmentDate: result.assignment.dueDate,
            // Format date as D/M/Y
            formattedDate: new Date(
              result.assignment.dueDate
            ).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "numeric",
              year: "numeric",
            }),
            type: "Assignment" as const,
          };
        }

        return null; // Skip if no assessment found
      })
      .filter(Boolean); // Remove null entries

    return NextResponse.json({
      results: resultsWithDetails,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { score, studentId, examId, assignmentId } = body;

    // Validate required fields
    if (score === undefined || !studentId || (!examId && !assignmentId)) {
      return NextResponse.json(
        {
          error:
            "Score, student ID, and either exam ID or assignment ID are required",
        },
        { status: 400 }
      );
    }

    // Validate score range
    if (score < 0 || score > 100) {
      return NextResponse.json(
        { error: "Score must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Validate that the student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Validate assessment and lesson
    let lesson;
    if (examId) {
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
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

      lesson = exam.lesson;
    } else if (assignmentId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
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

      lesson = assignment.lesson;
    }

    // Check if student is enrolled in the lesson's class
    const studentClassId = student.class.id;
    const lessonClassIds = lesson?.classes.map((cls: any) => cls.id) || [];

    if (!lessonClassIds.includes(studentClassId)) {
      return NextResponse.json(
        { error: "Student is not enrolled in the class for this lesson" },
        { status: 400 }
      );
    }

    // Check if result already exists for this student and assessment
    const existingResult = await prisma.result.findFirst({
      where: {
        studentId,
        ...(examId ? { examId } : { assignmentId }),
      },
    });

    if (existingResult) {
      return NextResponse.json(
        { error: "Result already exists for this student and assessment" },
        { status: 400 }
      );
    }

    // Create the result
    const result = await prisma.result.create({
      data: {
        score,
        studentId,
        ...(examId ? { examId } : { assignmentId }),
      },
      include: {
        student: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
          },
        },
        exam: examId
          ? {
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
            }
          : undefined,
        assignment: assignmentId
          ? {
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
            }
          : undefined,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating result:", error);
    return NextResponse.json(
      { error: "Failed to create result" },
      { status: 500 }
    );
  }
}
