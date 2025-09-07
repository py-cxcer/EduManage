import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../Model/prisma";

async function resolveStudentByParam(idOrUserId: string) {
  let student = await prisma.student.findUnique({ where: { id: idOrUserId } });
  if (student) return student;

  const user = await prisma.user.findUnique({ where: { id: idOrUserId } });
  if (!user) return null;
  student = await prisma.student.findUnique({
    where: { username: user.username },
  });
  return student;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log("Fetching stats for student with ID:", id);

    // Find the student first
    const resolved = await resolveStudentByParam(id);
    if (!resolved) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const student = await prisma.student.findUnique({
      where: { id: resolved.id },
      include: {
        grade: true,
        class: {
          include: {
            grade: true,
          },
        },
        parent: true,
        attendances: {
          include: {
            lesson: {
              include: {
                subject: true,
                teacher: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        },
        results: {
          include: {
            exam: {
              include: {
                lesson: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
            assignment: {
              include: {
                lesson: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
          orderBy: {
            id: "desc",
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Calculate attendance statistics
    const totalAttendanceRecords = student.attendances.length;
    const presentRecords = student.attendances.filter(
      (att) => att.present
    ).length;
    const attendancePercentage =
      totalAttendanceRecords > 0
        ? Math.round((presentRecords / totalAttendanceRecords) * 100)
        : 0;

    // Calculate recent attendance (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAttendances = student.attendances.filter(
      (att) => new Date(att.date) >= thirtyDaysAgo
    );
    const recentPresent = recentAttendances.filter((att) => att.present).length;
    const recentAttendancePercentage =
      recentAttendances.length > 0
        ? Math.round((recentPresent / recentAttendances.length) * 100)
        : 0;

    // Calculate academic performance
    const totalResults = student.results.length;
    const averageScore =
      totalResults > 0
        ? Math.round(
            student.results.reduce((sum, result) => sum + result.score, 0) /
              totalResults
          )
        : 0;

    // Get recent results (last 10)
    const recentResults = student.results.slice(0, 10);

    // Get attendance by subject
    const attendanceBySubject = student.attendances.reduce(
      (acc, attendance) => {
        const subjectName = attendance.lesson.subject.name;
        if (!acc[subjectName]) {
          acc[subjectName] = { total: 0, present: 0 };
        }
        acc[subjectName].total++;
        if (attendance.present) {
          acc[subjectName].present++;
        }
        return acc;
      },
      {} as Record<string, { total: number; present: number }>
    );

    // Convert to percentage
    const attendanceBySubjectPercentage = Object.entries(
      attendanceBySubject
    ).map(([subject, data]) => ({
      subject,
      percentage:
        data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
      total: data.total,
      present: data.present,
    }));

    const stats = {
      attendance: {
        overall: attendancePercentage,
        recent: recentAttendancePercentage,
        totalRecords: totalAttendanceRecords,
        presentRecords,
        bySubject: attendanceBySubjectPercentage,
      },
      academic: {
        averageScore,
        totalResults,
        recentResults: recentResults.map((result) => ({
          id: result.id,
          score: result.score,
          type: result.examId ? "exam" : "assignment",
          subject:
            result.exam?.lesson?.subject?.name ||
            result.assignment?.lesson?.subject?.name ||
            "Unknown",
          title: result.exam?.title || result.assignment?.title || "Unknown",
          date: result.exam?.startTime || result.assignment?.dueDate,
        })),
      },
      classInfo: {
        grade: student.grade?.level || 0,
        className:
          `${student.grade?.level || ""}${student.class?.name || ""}` ||
          "Unknown",
        classCapacity: student.class?.capacity || 0,
        parentName: `${student.parent?.name || ""} ${
          student.parent?.surname || ""
        }`.trim(),
      },
    };

    console.log("Student stats calculated:", stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching student stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch student stats" },
      { status: 500 }
    );
  }
}
