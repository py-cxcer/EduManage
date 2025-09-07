import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../Model/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await prisma.result.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        exam: {
          include: {
            lesson: {
              include: {
                subject: true,
                class: {
                  include: {
                    grade: true,
                  },
                },
                teacher: true,
              },
            },
          },
        },
        assignment: {
          include: {
            lesson: {
              include: {
                subject: true,
                class: {
                  include: {
                    grade: true,
                  },
                },
                teacher: true,
              },
            },
          },
        },
        student: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching result:", error);
    return NextResponse.json(
      { error: "Failed to fetch result" },
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

    // Check if result exists
    const existingResult = await prisma.result.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!existingResult) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
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

    // Check if result already exists for this student and assessment (excluding current result)
    const duplicateResult = await prisma.result.findFirst({
      where: {
        studentId,
        ...(examId ? { examId } : { assignmentId }),
        NOT: { id: parseInt(params.id) },
      },
    });

    if (duplicateResult) {
      return NextResponse.json(
        { error: "Result already exists for this student and assessment" },
        { status: 400 }
      );
    }

    // Update the result
    const result = await prisma.result.update({
      where: { id: parseInt(params.id) },
      data: {
        score,
        studentId,
        ...(examId
          ? { examId, assignmentId: null }
          : { assignmentId, examId: null }),
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

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating result:", error);
    return NextResponse.json(
      { error: "Failed to update result" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await prisma.result.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Result deleted successfully" });
  } catch (error) {
    console.error("Error deleting result:", error);
    return NextResponse.json(
      { error: "Failed to delete result" },
      { status: 500 }
    );
  }
}
