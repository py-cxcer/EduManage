import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../Model/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    console.log("Finding teacher by user ID:", userId);

    // First find the user to get their username
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Then find the teacher by username
    const teacher = await prisma.teacher.findUnique({
      where: { username: user.username },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({ teacherId: teacher.id });
  } catch (error) {
    console.error("Error finding teacher by user ID:", error);
    return NextResponse.json(
      { error: "Failed to find teacher" },
      { status: 500 }
    );
  }
}
