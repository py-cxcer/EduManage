import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";

// GET /api/attendance?classId=1&lessonId=2&date=2025-09-01
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const lessonIdParam = searchParams.get("lessonId");
    const dateParam = searchParams.get("date");

    if (!classId || !lessonIdParam || !dateParam) {
      return NextResponse.json(
        { error: "classId, lessonId and date are required" },
        { status: 400 }
      );
    }

    const lessonId = parseInt(lessonIdParam);
    const date = new Date(dateParam);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // fetch students in class
    const students = await prisma.student.findMany({
      where: { classId: parseInt(classId) },
      select: { id: true, name: true, surname: true },
      orderBy: { id: "asc" },
    });

    // fetch existing attendance for date + lesson
    const records = await prisma.attendance.findMany({
      where: {
        lessonId,
        date: { gte: start, lte: end },
      },
      select: { id: true, studentId: true, present: true },
    });

    const map: Record<string, boolean> = {};
    for (const r of records) map[r.studentId] = r.present;

    const result = students.map((s) => ({
      studentId: s.id,
      name: `${s.name} ${s.surname}`,
      present: map[s.id] ?? false,
    }));

    return NextResponse.json({ items: result });
  } catch (e) {
    console.error("Attendance GET error", e);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

// POST /api/attendance  { lessonId, date, items: [{studentId, present}] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, date, items } = body || {};
    if (!lessonId || !date || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "lessonId, date and items[] are required" },
        { status: 400 }
      );
    }
    const day = new Date(date);
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    await prisma.$transaction(async (tx) => {
      // delete existing records for this lesson and day, then recreate from payload
      await tx.attendance.deleteMany({
        where: { lessonId: parseInt(lessonId), date: { gte: start, lte: end } },
      });

      if (items.length === 0) return;

      await tx.attendance.createMany({
        data: items.map((it: any) => ({
          lessonId: parseInt(lessonId),
          date: start,
          studentId: String(it.studentId),
          present: Boolean(it.present),
        })),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Attendance POST error", e);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
