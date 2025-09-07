import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching all announcements");

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
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Get total count for pagination (with search filter)
    const totalItems = await prisma.announcement.count({
      where: searchConditions,
    });
    const totalPages = Math.ceil(totalItems / limit);

    const announcements = await prisma.announcement.findMany({
      where: searchConditions,
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
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
      orderBy: {
        date: "desc",
      },
      skip: skip,
      take: limit,
    });

    // Transform the data to include all required information
    const announcementsWithDetails = announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      description: announcement.description,
      className: announcement.class
        ? `${announcement.class.grade.level}${announcement.class.name}`
        : "All Classes",
      date: announcement.date,
      // Format date as D/M/Y
      formattedDate: new Date(announcement.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      }),
    }));

    return NextResponse.json({
      announcements: announcementsWithDetails,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, date, classId, audience } = body; // audience: 'all' | 'class'

    if (!title || !date) {
      return NextResponse.json(
        { error: "Title and date are required" },
        { status: 400 }
      );
    }

    const when = new Date(date);
    if (isNaN(when.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const created = await prisma.announcement.create({
      data: {
        title: String(title),
        description: description ? String(description) : "",
        date: when,
        // If audience is 'all', keep classId null so it shows to everyone
        ...(audience === "class" && classId
          ? {
              classId:
                typeof classId === "string"
                  ? parseInt(classId, 10)
                  : Number(classId),
            }
          : {}),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create announcement" },
      { status: 500 }
    );
  }
}
