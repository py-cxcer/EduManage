import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching all grades");

    const grades = await prisma.grade.findMany({
      orderBy: {
        level: "asc",
      },
    });

    return NextResponse.json({
      grades,
    });
  } catch (error) {
    console.error("Error fetching grades:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
      { status: 500 }
    );
  }
}
