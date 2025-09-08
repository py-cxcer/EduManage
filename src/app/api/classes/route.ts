import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching all classes");
    const { searchParams } = new URL(request.url);
    const gradeIdParam = searchParams.get("gradeId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    let where: any = gradeIdParam ? { gradeId: Number(gradeIdParam) } : {};

    // If TEACHER: restrict to their assigned classes
    try {
      const session = (await getServerSession(authOptions as any)) as any;
      if (session?.user?.role === "TEACHER") {
        const teacher = await prisma.teacher.findUnique({
          where: { id: String(session.user.id) },
          include: { classes: { select: { id: true } } },
        });
        const classIds = (teacher?.classes || []).map((c) => c.id);
        if (classIds.length > 0) where.id = { in: classIds };
        else
          return NextResponse.json({
            classes: [],
            totalItems: 0,
            totalPages: 0,
            currentPage: page,
            itemsPerPage: limit,
          });
      }
    } catch {}

    const totalItems = await prisma.class.count({ where });
    const totalPages = Math.ceil(totalItems / limit);

    const classes = await prisma.class.findMany({
      where,
      include: {
        grade: true,
        supervisor: {
          select: { name: true, surname: true },
        },
      },
      orderBy: [
        {
          grade: {
            level: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
      skip,
      take: limit,
    });

    return NextResponse.json({
      classes,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null as any);
    const { name, capacity, gradeLevel, supervisorId } = body || {};

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Class name is required" },
        { status: 400 }
      );
    }

    // Normalize: extract digits as grade level and letters as section (class name)
    const trimmed = name.trim();
    const digitsMatch = trimmed.match(/^(\d{1,2})/);
    const lettersMatch = trimmed.match(/([A-Za-z]+)$/);
    const normalizedName = lettersMatch
      ? lettersMatch[1].toUpperCase()
      : trimmed.toUpperCase();
    const targetLevel =
      Number(gradeLevel) ||
      (digitsMatch ? parseInt(digitsMatch[1], 10) : undefined);

    if (!targetLevel) {
      return NextResponse.json(
        { error: "Grade level is required (e.g., '9A' -> Grade 9)" },
        { status: 400 }
      );
    }

    // Ensure grade exists
    let grade = await prisma.grade.findUnique({
      where: { level: targetLevel },
    });
    if (!grade) {
      grade = await prisma.grade.create({ data: { level: targetLevel } });
    }

    const created = await prisma.class.create({
      data: {
        name: normalizedName,
        capacity: typeof capacity === "number" ? capacity : 30,
        grade: { connect: { id: grade.id } },
        supervisor: supervisorId
          ? { connect: { id: String(supervisorId) } }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        grade: { select: { level: true } },
        supervisor: { select: { name: true, surname: true } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    if ((error as any)?.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "A class with this grade and section already exists. Choose a different section or grade.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}
