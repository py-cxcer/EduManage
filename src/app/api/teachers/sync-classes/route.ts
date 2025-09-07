import { NextRequest, NextResponse } from "next/server";
import { syncAllTeacherClasses } from "../../../../lib/teacherClassSync";

export async function POST(request: NextRequest) {
  try {
    console.log("Syncing teacher-class relationships based on lessons");

    const teachersUpdated = await syncAllTeacherClasses();

    console.log("Teacher-class relationships synced successfully");
    return NextResponse.json({
      message: "Teacher-class relationships synced successfully",
      teachersUpdated,
    });
  } catch (error) {
    console.error("Error syncing teacher-class relationships:", error);
    return NextResponse.json(
      { error: "Failed to sync teacher-class relationships" },
      { status: 500 }
    );
  }
}
