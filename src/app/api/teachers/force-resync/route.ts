import { NextRequest, NextResponse } from "next/server";
import { forceResyncAllTeachers } from "../../../../lib/teacherClassSync";

export async function POST(request: NextRequest) {
  try {
    console.log("Starting forced resync of all teachers...");

    const teachersUpdated = await forceResyncAllTeachers();

    return NextResponse.json({
      message: "Forced resync completed successfully",
      teachersUpdated,
    });
  } catch (error) {
    console.error("Error during forced resync:", error);
    return NextResponse.json(
      { error: "Failed to perform forced resync" },
      { status: 500 }
    );
  }
}
