import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

// Unified schedule feed for lessons, assignments, and exams
// Query params: start, end (ISO strings), optional classId, subjectId, teacherId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const classIdParam = searchParams.get("classId");
    const subjectIdParam = searchParams.get("subjectId");
    const teacherIdParam = searchParams.get("teacherId");

    const start = startParam ? new Date(startParam) : undefined;
    const end = endParam ? new Date(endParam) : undefined;

    const session: any = await getServerSession(authOptions as any);
    const role = session?.user?.role as string | undefined;
    const userId = session?.user?.id as string | undefined;

    // Build common scoping conditions based on role
    const teacherScope: any = {};
    const lessonWhere: any = {};
    let studentClassIds: number[] = [];

    if (role === "TEACHER" && userId) {
      teacherScope.teacherId = userId;
      lessonWhere.teacherId = userId;
    }

    // Student scoping: only lessons/exams/assignments for the student's class
    if ((role === "STUDENT" || role === "PARENT") && userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true },
        });
        if (user?.username) {
          if (role === "STUDENT") {
            const student = await prisma.student.findUnique({
              where: { username: user.username },
              select: { classId: true },
            });
            if (student?.classId) studentClassIds = [student.classId];
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
              studentClassIds = children
                .map((c) => c.classId)
                .filter(Boolean) as number[];
            }
          }
          if (studentClassIds.length > 0) {
            lessonWhere.OR = [
              { classId: { in: studentClassIds } },
              { classes: { some: { id: { in: studentClassIds } } } },
            ];
          }
        }
      } catch (e) {
        console.error("Failed to resolve student class for schedule", e);
      }
    }

    if (subjectIdParam) {
      lessonWhere.subjectId = Number(subjectIdParam);
    }
    if (classIdParam) {
      lessonWhere.classes = { some: { id: Number(classIdParam) } };
    }
    if (teacherIdParam) {
      lessonWhere.teacherId = String(teacherIdParam);
    }

    // Fetch lessons (role-scoped)
    const lessons = await prisma.lesson.findMany({
      where: lessonWhere,
      select: {
        id: true,
        // Use any cast on select to include custom fields safely
        ...({
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          daysJson: true,
        } as any),
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
      orderBy: { id: "asc" },
    });

    // Fetch exams (respect range if provided)
    const examWhere: any = {
      lesson: {
        ...(Object.keys(lessonWhere).length ? lessonWhere : {}),
      },
    };
    if (studentClassIds.length > 0) {
      examWhere.OR = [
        { classId: { in: studentClassIds } },
        // also allow exams without explicit classId but lesson has matching class
      ];
    }
    if (start && end) {
      examWhere.AND = [
        { startTime: { gte: start } },
        { endTime: { lte: end } },
      ];
    }

    const exams = await prisma.exam.findMany({
      where: examWhere,
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        classId: true,
        lesson: {
          select: {
            subjectId: true,
            teacherId: true,
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
      orderBy: { startTime: "asc" },
    });

    // Fetch assignments (respect range if provided)
    const assignmentWhere: any = {
      lesson: {
        ...(Object.keys(lessonWhere).length ? lessonWhere : {}),
      },
    };
    if (start && end) {
      assignmentWhere.dueDate = { gte: start, lte: end };
    }
    if (studentClassIds.length > 0) {
      assignmentWhere.OR = [{ classId: { in: studentClassIds } }];
    }

    const assignments = await prisma.assignment.findMany({
      where: assignmentWhere,
      select: {
        id: true,
        title: true,
        dueDate: true,
        classId: true,
        lesson: {
          select: {
            subjectId: true,
            teacherId: true,
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
      orderBy: { dueDate: "asc" },
    });

    // Map to unified events
    const events: any[] = [];

    // Lessons: recurring by dayOfWeek/daysJson + startTime/endTime
    for (const lesson of lessons) {
      const classLabel = (lesson as any).classes
        .map((c: any) => `${c.grade?.level ?? ""}${c.name}`)
        .join(", ");
      const hasRecurrence =
        (((lesson as any).dayOfWeek !== undefined &&
          (lesson as any).dayOfWeek !== null) ||
          (Array.isArray((lesson as any).daysJson) &&
            (lesson as any).daysJson.length > 0)) &&
        (lesson as any).startTime;
      if (hasRecurrence && start && end) {
        const daySet: number[] = Array.isArray((lesson as any).daysJson)
          ? (lesson as any).daysJson.map((x: any) => Number(x))
          : [Number((lesson as any).dayOfWeek)];
        const cur = new Date(start);
        while (cur <= end) {
          if (daySet.includes(cur.getDay())) {
            const [sh, sm] = String((lesson as any).startTime).split(":");
            const [eh, em] = String(
              (lesson as any).endTime || (lesson as any).startTime
            ).split(":");
            const s = new Date(cur);
            s.setHours(parseInt(sh || "0"), parseInt(sm || "0"), 0, 0);
            const e = new Date(cur);
            e.setHours(parseInt(eh || "0"), parseInt(em || "0"), 0, 0);
            events.push({
              id: `lesson-${lesson.id}-${s.toISOString()}`,
              type: "lesson",
              title: `${(lesson as any).subject.name} • ${classLabel}`,
              start: s,
              end: e,
              allDay: false,
              color: "#6B8A7A",
              meta: {
                lessonId: lesson.id,
                classId: (lesson as any).classes?.[0]?.id,
              },
            });
          }
          cur.setDate(cur.getDate() + 1);
        }
      }
    }

    for (const ex of exams) {
      const classLabel = ex.classId
        ? ex.lesson.classes
            .filter((c: any) => c.id === ex.classId)
            .map((c: any) => `${c.grade?.level ?? ""}${c.name}`)
            .join(", ")
        : ex.lesson.classes
            .map((c: any) => `${c.grade?.level ?? ""}${c.name}`)
            .join(", ");
      events.push({
        id: `exam-${ex.id}`,
        type: "exam",
        title: `${ex.title} • ${ex.lesson.subject.name} • ${classLabel}`,
        start: ex.startTime,
        end: ex.endTime,
        allDay: false,
        color: "#B17F59",
        meta: {
          examId: ex.id,
          classId: ex.classId,
          subjectId: ex.lesson.subjectId,
          teacherId: ex.lesson.teacherId,
        },
      });
    }

    for (const asn of assignments) {
      const classLabel = asn.classId
        ? asn.lesson.classes
            .filter((c: any) => c.id === asn.classId)
            .map((c: any) => `${c.grade?.level ?? ""}${c.name}`)
            .join(", ")
        : asn.lesson.classes
            .map((c: any) => `${c.grade?.level ?? ""}${c.name}`)
            .join(", ");
      const due = new Date(asn.dueDate);
      const endDue = new Date(due.getTime());
      events.push({
        id: `assignment-${asn.id}`,
        type: "assignment",
        title: `${asn.title} • ${asn.lesson.subject.name} • ${classLabel}`,
        start: due,
        end: endDue,
        allDay: true,
        color: "#8DAA9D",
        meta: {
          assignmentId: asn.id,
          classId: asn.classId,
          subjectId: asn.lesson.subjectId,
          teacherId: asn.lesson.teacherId,
        },
      });
    }

    // Sort for consistency
    events.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    return NextResponse.json({
      events,
      range: { start: startParam, end: endParam },
    });
  } catch (error) {
    console.error("Error building schedule:", error);
    return NextResponse.json(
      { error: "Failed to load schedule" },
      { status: 500 }
    );
  }
}
