import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching all events");

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
    const totalItems = await prisma.event.count({
      where: searchConditions,
    });
    const totalPages = Math.ceil(totalItems / limit);

    const events = await prisma.event.findMany({
      where: searchConditions,
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
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
        startTime: "asc",
      },
      skip: skip,
      take: limit,
    });

    // Transform the data to include all required information
    const eventsWithDetails = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      className: event.class
        ? `${event.class.grade.level}${event.class.name}`
        : "All Classes",
      startTime: event.startTime,
      endTime: event.endTime,
      // Format date as D/M/Y
      formattedDate: new Date(event.startTime).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      }),
      // Format start time as HH:MM
      formattedStartTime: new Date(event.startTime).toLocaleTimeString(
        "en-GB",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      ),
      // Format end time as HH:MM
      formattedEndTime: new Date(event.endTime).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    }));

    return NextResponse.json({
      events: eventsWithDetails,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, date, startTime, endTime, classId } = body;

    if (!title || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Title, date, start time and end time are required" },
        { status: 400 }
      );
    }

    // Combine date with times
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });
    }
    if (end < start) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const created = await prisma.event.create({
      data: {
        title: String(title),
        description: description ? String(description) : "",
        startTime: start,
        endTime: end,
        ...(classId
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
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create event" },
      { status: 500 }
    );
  }
}
