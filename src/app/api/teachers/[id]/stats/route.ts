import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../Model/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log("Fetching stats for teacher with ID:", id);

    // Find the teacher first
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        lessons: {
          include: {
            class: true,
            subject: true,
          },
        },
        classes: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Calculate statistics
    const lessons = teacher.lessons.length;
    const classes = teacher.classes.length;

    // For now, using mock data for attendance and branches
    // You can implement actual calculations based on your business logic
    const attendance = 90; // Mock: calculate from actual attendance records
    const branches = 2; // Mock: calculate from actual branch assignments

    const stats = {
      attendance,
      branches,
      lessons,
      classes,
    };

    console.log("Teacher stats calculated:", stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching teacher stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher stats" },
      { status: 500 }
    );
  }
}
