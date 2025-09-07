import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching all classes");
    const { searchParams } = new URL(request.url);
    const gradeIdParam = searchParams.get("gradeId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = gradeIdParam ? { gradeId: Number(gradeIdParam) } : undefined;

    const totalItems = await prisma.class.count({ where: where as any });
    const totalPages = Math.ceil(totalItems / limit);

    const classes = await prisma.class.findMany({
      where: where as any,
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
