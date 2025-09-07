import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, teacherIds } = body;

    console.log("Creating subject:", { name, teacherIds });

    if (!name) {
      return NextResponse.json(
        { error: "Subject name is required" },
        { status: 400 }
      );
    }

    // Create the subject
    const subject = await prisma.subject.create({
      data: {
        name,
        teachers:
          teacherIds && teacherIds.length > 0
            ? {
                connect: teacherIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
      include: {
        teachers: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    return NextResponse.json(subject);
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching all subjects");

    // Get pagination and search parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // Build search conditions
    const searchConditions = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            {
              id: {
                equals: isNaN(parseInt(search)) ? undefined : parseInt(search),
              },
            },
          ].filter((condition) => Object.values(condition)[0] !== undefined),
        }
      : {};

    // Get total count for pagination (with search filter)
    const totalItems = await prisma.subject.count({
      where: searchConditions,
    });
    const totalPages = Math.ceil(totalItems / limit);

    const subjects = await prisma.subject.findMany({
      where: searchConditions,
      select: {
        id: true,
        name: true,
        teachers: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      skip: skip,
      take: limit,
    });

    // Transform the data to include teacher names as a string
    const subjectsWithTeacherNames = subjects.map((subject: any) => ({
      id: subject.id,
      name: subject.name,
      teacherNames:
        subject.teachers
          .map((teacher: any) => `${teacher.name} ${teacher.surname}`)
          .join(", ") || "No teachers assigned",
      teachers: subject.teachers.map((teacher: any) => ({
        id: teacher.id,
        name: teacher.name,
        surname: teacher.surname,
      })),
    }));

    return NextResponse.json({
      subjects: subjectsWithTeacherNames,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
