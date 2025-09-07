import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../Model/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
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
    const { title, description, date, startTime, endTime, classId } = body;
    const updates: any = {};
    if (title !== undefined) updates.title = String(title);
    if (description !== undefined)
      updates.description = String(description || "");
    if (date && startTime && endTime) {
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "Invalid date/time" },
          { status: 400 }
        );
      }
      if (end < start) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        );
      }
      updates.startTime = start;
      updates.endTime = end;
    }
    if (classId !== undefined) {
      updates.classId =
        typeof classId === "string" ? parseInt(classId, 10) : Number(classId);
    }

    const updated = await prisma.event.update({
      where: { id: parseInt(params.id) },
      data: updates,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
