import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../Model/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcement" },
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
    const { title, description, date, classId, audience } = body; // audience: 'all' | 'class'
    const updates: any = {};
    if (title !== undefined) updates.title = String(title);
    if (description !== undefined)
      updates.description = String(description || "");
    if (date) {
      const when = new Date(date);
      if (isNaN(when.getTime())) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }
      updates.date = when;
    }
    if (audience === "all") {
      updates.classId = null;
    } else if (audience === "class" && classId !== undefined) {
      updates.classId =
        typeof classId === "string" ? parseInt(classId, 10) : Number(classId);
    }

    const updated = await prisma.announcement.update({
      where: { id: parseInt(params.id) },
      data: updates,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update announcement" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const announcement = await prisma.announcement.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
